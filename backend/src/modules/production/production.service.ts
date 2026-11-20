/**
 * Production & BOM Management Service
 * Order-to-Audit Manufacturing ERP
 * 
 * Strict Invariants & Capabilities:
 * 1. Dynamic material requirement calculation from BOM recipes
 * 2. Pre-execution atomic stock availability validation (RM & PM)
 * 3. Atomic stock updates:
 *    - Deduct raw material actual consumption (PRODUCTION_ISSUE)
 *    - Deduct packaging consumption (PRODUCTION_ISSUE)
 *    - Record damaged packaging separately (SCRAP_DISPOSAL)
 *    - Add actual good packets to finished-goods inventory (FG_RECEIPT)
 * 4. Consumption & Yield Variance Calculations with threshold alerts (Default 3% tolerance)
 *    - Benchmark Oil: ((10.5 - 10) / 10) * 100 = +5% (Alert)
 *    - Benchmark Yield: ((188 - 200) / 200) * 100 = -6% (Alert)
 * 5. Unit Conversion Integration (KG <-> G, LTR <-> ML, CTN <-> PKT)
 * 6. Audit Trail & Stock Ledger linkage to RUN-YYYY-XXXXX
 * 7. Duplicate posting prevention
 */

import {
  BillOfMaterialDTO,
  BOMItemDTO,
  ProductionRunDTO,
  MaterialConsumptionDTO,
  ProductionOutputDTO,
  OverheadCostDTO,
  VarianceAlertDTO,
  CreateBOMRequest,
  CreateProductionRunRequest,
  CompleteProductionRunRequest,
  ProductionDashboardSummary,
  ProductionStatus,
} from './production.types';
import { BENCHMARK_MURUKKU_BOM } from './production.benchmark';
import { InventoryService, inventoryStore } from '../inventory/inventory.service';
import { UnitConversionUtil } from './unit-conversion.util';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/appError';
import { recordSecurityAudit } from '../audit/audit.service';

const DEFAULT_VARIANCE_TOLERANCE_PCT = 3.0; // 3% tolerance threshold

class ProductionStore {
  public boms: Map<string, BillOfMaterialDTO> = new Map();
  public runs: Map<string, ProductionRunDTO> = new Map();
  public runSequence: number = 100;
  public bomSequence: number = 10;

  constructor() {
    this.resetToBenchmark();
  }

  public resetToBenchmark() {
    this.boms.clear();
    this.runs.clear();
    this.runSequence = 100;
    this.bomSequence = 10;

    // Load Benchmark Murukku BOM
    this.boms.set(BENCHMARK_MURUKKU_BOM.id, JSON.parse(JSON.stringify(BENCHMARK_MURUKKU_BOM)));
  }
}

export const productionStore = new ProductionStore();

export class ProductionService {
  /**
   * Reset store to benchmark data
   */
  static resetBenchmark() {
    productionStore.resetToBenchmark();
  }

  // ==========================================
  // PART A: BOM MANAGEMENT
  // ==========================================

  static listBOMs(productId?: string): BillOfMaterialDTO[] {
    let list = Array.from(productionStore.boms.values());
    if (productId) {
      list = list.filter((b) => b.productId === productId || b.productCode === productId);
    }
    return list;
  }

  static getBOMById(id: string): BillOfMaterialDTO {
    const bom = productionStore.boms.get(id);
    if (!bom) {
      const byNumber = Array.from(productionStore.boms.values()).find(
        (b) => b.bomNumber === id || b.productCode === id
      );
      if (!byNumber) {
        throw new NotFoundError(`Bill of Materials not found for id/number: ${id}`);
      }
      return byNumber;
    }
    return bom;
  }

  static async createBOM(req: CreateBOMRequest, createdBy: string = 'usr-admin-01'): Promise<BillOfMaterialDTO> {
    if (!req.items || req.items.length === 0) {
      throw new BadRequestError('BOM must contain at least one raw material or packaging item');
    }
    if (req.expectedOutput <= 0) {
      throw new BadRequestError('Expected batch output must be strictly positive');
    }

    // Lookup finished product from inventory
    const product = InventoryService.getItemById(req.productId);

    productionStore.bomSequence += 1;
    const bomNumber = `BOM-${product.itemCode}-${req.version.toUpperCase()}`;
    const id = `bom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let totalRawMaterialCost = 0;
    let totalPackagingCost = 0;

    const items: BOMItemDTO[] = req.items.map((item, idx) => {
      const material = InventoryService.getItemById(item.materialId);
      const unitCost = material.averageCost;
      const lineCost = Number((item.standardQty * unitCost).toFixed(2));

      if (item.itemType === 'RAW_MATERIAL') {
        totalRawMaterialCost += lineCost;
      } else {
        totalPackagingCost += lineCost;
      }

      return {
        id: `bomi-${id}-${idx + 1}`,
        itemType: item.itemType,
        materialId: material.id,
        materialCode: material.itemCode,
        materialName: material.itemName,
        standardQty: item.standardQty,
        unitCode: item.unitCode || material.unitCode,
        expectedWastagePct: item.expectedWastagePct || 0,
        unitCost,
        lineCost,
      };
    });

    totalRawMaterialCost = Number(totalRawMaterialCost.toFixed(2));
    totalPackagingCost = Number(totalPackagingCost.toFixed(2));
    const totalBatchCost = Number((totalRawMaterialCost + totalPackagingCost).toFixed(2));
    const costPerUnitOutput = Number((totalBatchCost / req.expectedOutput).toFixed(4));

    const newBOM: BillOfMaterialDTO = {
      id,
      bomNumber,
      productId: product.id,
      productCode: product.itemCode,
      productName: product.itemName,
      version: req.version,
      batchSize: req.batchSize || req.expectedOutput,
      batchUnit: req.batchUnit || product.unitCode,
      expectedOutput: req.expectedOutput,
      status: 'ACTIVE',
      effectiveDate: req.effectiveDate || new Date().toISOString(),
      items,
      totalRawMaterialCost,
      totalPackagingCost,
      totalBatchCost,
      costPerUnitOutput,
      notes: req.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    productionStore.boms.set(id, newBOM);

    await recordSecurityAudit({
      userId: createdBy,
      entityName: 'BILL_OF_MATERIAL',
      entityId: id,
      actionType: 'CREATE',
      newValues: {
        bomNumber,
        productCode: product.itemCode,
        totalBatchCost,
      },
    });

    return newBOM;
  }

  /**
   * Calculate exact raw-material & packaging requirements scaled to a planned output quantity
   */
  static calculateMaterialRequirements(
    bomId: string,
    plannedOutput: number
  ): {
    materialId: string;
    materialCode: string;
    materialName: string;
    itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
    plannedQty: number;
    unitCode: string;
    unitCost: number;
    estimatedCost: number;
  }[] {
    const bom = this.getBOMById(bomId);
    if (bom.expectedOutput <= 0) {
      throw new BadRequestError('Invalid BOM: expected output must be greater than zero');
    }

    const scalingFactor = plannedOutput / bom.expectedOutput;

    return bom.items.map((item) => {
      const scaledQty = Number((item.standardQty * scalingFactor).toFixed(4));
      const estimatedCost = Number((scaledQty * item.unitCost).toFixed(2));
      return {
        materialId: item.materialId,
        materialCode: item.materialCode,
        materialName: item.materialName,
        itemType: item.itemType,
        plannedQty: scaledQty,
        unitCode: item.unitCode,
        unitCost: item.unitCost,
        estimatedCost,
      };
    });
  }

  // ==========================================
  // PART B: PRODUCTION RUN CREATION
  // ==========================================

  static listProductionRuns(filters?: {
    status?: ProductionStatus;
    search?: string;
  }): ProductionRunDTO[] {
    let list = Array.from(productionStore.runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.runNumber.toLowerCase().includes(q) ||
          r.batchNumber.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.supervisorName.toLowerCase().includes(q)
      );
    }

    return list;
  }

  static getProductionRunById(id: string): ProductionRunDTO {
    const run = productionStore.runs.get(id);
    if (!run) {
      const byNumber = Array.from(productionStore.runs.values()).find(
        (r) => r.runNumber === id || r.batchNumber === id
      );
      if (!byNumber) {
        throw new NotFoundError(`Production run not found for id/number: ${id}`);
      }
      return byNumber;
    }
    return run;
  }

  static async createProductionRun(
    req: CreateProductionRunRequest,
    userId: string = 'usr-supervisor-01'
  ): Promise<ProductionRunDTO> {
    const bom = this.getBOMById(req.bomId);
    const product = InventoryService.getItemById(req.productId);

    if (req.plannedOutput <= 0) {
      throw new BadRequestError('Planned production output must be strictly positive');
    }

    productionStore.runSequence += 1;
    const runNumber = `RUN-2026-${productionStore.runSequence.toString().padStart(5, '0')}`;
    const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${productionStore.runSequence.toString().padStart(3, '0')}`;
    const id = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate planned material requirements from BOM
    const plannedReqs = this.calculateMaterialRequirements(bom.id, req.plannedOutput);

    const materials: MaterialConsumptionDTO[] = plannedReqs.map((m) => ({
      itemType: m.itemType,
      materialId: m.materialId,
      materialCode: m.materialCode,
      materialName: m.materialName,
      plannedQty: m.plannedQty,
      actualQty: m.plannedQty, // Default actual to planned initially
      unitCode: m.unitCode,
      unitCost: m.unitCost,
      varianceQty: 0,
      variancePct: 0,
      isVarianceAlert: false,
    }));

    const totalDirectMaterialCost = Number(
      materials.reduce((acc, curr) => acc + curr.plannedQty * curr.unitCost, 0).toFixed(2)
    );

    const newRun: ProductionRunDTO = {
      id,
      runNumber,
      batchNumber,
      productId: product.id,
      productCode: product.itemCode,
      productName: product.itemName,
      bomId: bom.id,
      bomVersion: bom.version,
      plannedBatchSize: req.plannedBatchSize || req.plannedOutput,
      status: 'PLANNED',
      productionDate: req.productionDate || new Date().toISOString(),
      materials,
      output: {
        plannedOutput: req.plannedOutput,
        actualGoodOutput: 0,
        damagedOutput: 0,
        damagedPackagingQty: 0,
        unitCode: product.unitCode,
        yieldPct: 0,
        yieldVariancePct: 0,
        isYieldAlert: false,
      },
      overheads: {
        labourCost: 0,
        gasCost: 0,
        electricityCost: 0,
        totalOverheadCost: 0,
      },
      varianceAlerts: [],
      totalDirectMaterialCost,
      totalProductionCost: totalDirectMaterialCost,
      unitProductionCost: Number((totalDirectMaterialCost / req.plannedOutput).toFixed(4)),
      supervisorId: req.supervisorId || userId,
      supervisorName: req.supervisorName || 'M. Senthil (Production Supervisor)',
      notes: req.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    productionStore.runs.set(id, newRun);

    await recordSecurityAudit({
      userId,
      entityName: 'PRODUCTION_RUN',
      entityId: id,
      actionType: 'CREATE',
      newValues: {
        runNumber,
        batchNumber,
        productCode: product.itemCode,
        plannedOutput: req.plannedOutput,
      },
    });

    return newRun;
  }

  // ==========================================
  // PART C & D: ATOMIC INVENTORY UPDATE & VARIANCE ENGINE
  // ==========================================

  /**
   * Complete and Post Production Run:
   * 1. Validate raw-material availability
   * 2. Validate packaging-material availability
   * 3. Compute consumption & yield variances and generate alerts (> 3%)
   * 4. Deduct actual materials issued (PRODUCTION_ISSUE)
   * 5. Record packaging consumption
   * 6. Record damaged packaging separately
   * 7. Add actual good packets to finished goods (FG_RECEIPT)
   * 8. Link movements to the production run
   * 9. Prevent duplicate posting
   * All updates are executed atomically.
   */
  static async completeAndPostProductionRun(
    runId: string,
    req: CompleteProductionRunRequest,
    tolerancePct: number = DEFAULT_VARIANCE_TOLERANCE_PCT
  ): Promise<ProductionRunDTO> {
    const run = this.getProductionRunById(runId);

    // Rule 9: Prevent duplicate posting
    if (run.status === 'COMPLETED') {
      throw new BadRequestError(
        `Production run ${run.runNumber} has already been completed and posted. Duplicate posting is strictly prohibited.`
      );
    }
    if (run.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot complete cancelled production run ${run.runNumber}`);
    }

    if (req.actualGoodOutput <= 0) {
      throw new BadRequestError('Actual good production output must be strictly positive');
    }

    const varianceAlerts: VarianceAlertDTO[] = [];

    // Map actual quantities
    const actualMap = new Map<string, number>();
    for (const m of req.materials) {
      actualMap.set(m.materialId, m.actualQty);
    }

    // -------------------------------------------------------------
    // 1 & 2. PRE-CHECK INVENTORY AVAILABILITY (Both RM and PM)
    // -------------------------------------------------------------
    for (const mat of run.materials) {
      const actualQty = actualMap.has(mat.materialId)
        ? (actualMap.get(mat.materialId) as number)
        : mat.plannedQty;

      if (actualQty <= 0) {
        throw new BadRequestError(`Material quantity for ${mat.materialName} must be positive`);
      }

      const invItem = InventoryService.getItemById(mat.materialId);

      // Convert actualQty to base unit if necessary
      let requiredQty = actualQty;
      if (mat.unitCode !== invItem.unitCode && UnitConversionUtil.areCompatible(mat.unitCode, invItem.unitCode)) {
        requiredQty = UnitConversionUtil.convert(actualQty, mat.unitCode, invItem.unitCode);
      }

      if (invItem.currentStock < requiredQty) {
        const typeLabel = mat.itemType === 'RAW_MATERIAL' ? 'Raw Material' : 'Packaging Material';
        throw new BadRequestError(
          `Insufficient inventory for ${typeLabel}: ${mat.materialName} (${mat.materialCode}). Current stock: ${invItem.currentStock} ${invItem.unitCode}, Required: ${requiredQty} ${invItem.unitCode}`
        );
      }
    }

    // Check damaged packaging stock availability
    const damagedPackaging = req.damagedPackagingQty || 0;
    if (damagedPackaging > 0) {
      const pouchMat = run.materials.find((m) => m.itemType === 'PACKAGING_MATERIAL');
      if (pouchMat) {
        const invItem = InventoryService.getItemById(pouchMat.materialId);
        const pouchActual = actualMap.has(pouchMat.materialId)
          ? (actualMap.get(pouchMat.materialId) as number)
          : pouchMat.plannedQty;
        // Total required pouches = good packaging + damaged packaging
        if (invItem.currentStock < pouchActual) {
          throw new BadRequestError(
            `Insufficient packaging inventory for damaged pouch scrap: Current stock ${invItem.currentStock}, Total required: ${pouchActual}`
          );
        }
      }
    }

    // -------------------------------------------------------------
    // PART D: VARIANCE CALCULATIONS & ALERTS
    // -------------------------------------------------------------
    let totalDirectMaterialCost = 0;

    const updatedMaterials: MaterialConsumptionDTO[] = run.materials.map((mat) => {
      const actualQty = actualMap.has(mat.materialId)
        ? (actualMap.get(mat.materialId) as number)
        : mat.plannedQty;

      const varianceQty = Number((actualQty - mat.plannedQty).toFixed(4));
      // Formula: ((Actual - Planned) / Planned) * 100
      const variancePct = Number(
        mat.plannedQty > 0 ? (((actualQty - mat.plannedQty) / mat.plannedQty) * 100).toFixed(2) : 0
      );
      const isVarianceAlert = Math.abs(variancePct) > tolerancePct;

      if (isVarianceAlert) {
        varianceAlerts.push({
          type: 'CONSUMPTION',
          itemCode: mat.materialCode,
          itemName: mat.materialName,
          planned: mat.plannedQty,
          actual: actualQty,
          unitCode: mat.unitCode,
          variancePct,
          thresholdPct: tolerancePct,
          severity: Math.abs(variancePct) > 10 ? 'CRITICAL' : 'WARNING',
          message: `Consumption variance of ${variancePct > 0 ? '+' : ''}${variancePct}% for ${mat.materialName} exceeds ±${tolerancePct}% tolerance (Planned: ${mat.plannedQty} ${mat.unitCode}, Actual: ${actualQty} ${mat.unitCode})`,
        });
      }

      totalDirectMaterialCost += actualQty * mat.unitCost;

      return {
        ...mat,
        actualQty,
        varianceQty,
        variancePct,
        isVarianceAlert,
      };
    });

    // Yield Variance Calculation
    const plannedOutput = run.output.plannedOutput;
    const actualGoodOutput = req.actualGoodOutput;
    const damagedOutput = req.damagedOutput || 0;
    const yieldPct = Number(((actualGoodOutput / plannedOutput) * 100).toFixed(2));
    // Formula: ((Actual Output - Expected Output) / Expected Output) * 100
    const yieldVariancePct = Number((((actualGoodOutput - plannedOutput) / plannedOutput) * 100).toFixed(2));
    const isYieldAlert = Math.abs(yieldVariancePct) > tolerancePct;

    if (isYieldAlert) {
      varianceAlerts.push({
        type: 'YIELD',
        itemCode: run.productCode,
        itemName: run.productName,
        planned: plannedOutput,
        actual: actualGoodOutput,
        unitCode: run.output.unitCode,
        variancePct: yieldVariancePct,
        thresholdPct: tolerancePct,
        severity: Math.abs(yieldVariancePct) > 10 ? 'CRITICAL' : 'WARNING',
        message: `Production yield variance of ${yieldVariancePct > 0 ? '+' : ''}${yieldVariancePct}% for ${run.productName} exceeds ±${tolerancePct}% tolerance (Expected: ${plannedOutput} ${run.output.unitCode}, Actual: ${actualGoodOutput} ${run.output.unitCode})`,
      });
    }

    // -------------------------------------------------------------
    // PART C: ATOMIC INVENTORY MOVEMENTS (Strict Ledger Linkage)
    // -------------------------------------------------------------
    // Save inventory store state snapshot for in-memory rollback if needed
    const itemsSnapshot = new Map(inventoryStore.items);
    const ledgerSnapshot = [...inventoryStore.ledger];

    try {
      // 3. Deduct actual materials issued (Raw Materials)
      for (const mat of updatedMaterials) {
        if (mat.itemType === 'RAW_MATERIAL') {
          await InventoryService.recordStockMovement({
            itemId: mat.materialId,
            movementType: 'PRODUCTION_ISSUE',
            sourceDocumentType: 'PRODUCTION_RUN',
            sourceDocumentId: run.runNumber,
            quantity: mat.actualQty,
            performedBy: req.supervisorId || run.supervisorId,
            performerName: req.supervisorName || run.supervisorName,
            notes: `Batch raw material issue for Production Run ${run.runNumber} (${run.batchNumber})`,
          });
        }
      }

      // 4. Record packaging consumption (Packaging Materials)
      for (const mat of updatedMaterials) {
        if (mat.itemType === 'PACKAGING_MATERIAL') {
          // If packaging has damaged items recorded separately, deduct actual net good consumption first
          const isPouch = mat.materialCode.includes('POUCH');
          const qtyToIssue = isPouch && damagedPackaging > 0 ? mat.actualQty - damagedPackaging : mat.actualQty;

          await InventoryService.recordStockMovement({
            itemId: mat.materialId,
            movementType: 'PRODUCTION_ISSUE',
            sourceDocumentType: 'PRODUCTION_RUN',
            sourceDocumentId: run.runNumber,
            quantity: qtyToIssue,
            performedBy: req.supervisorId || run.supervisorId,
            performerName: req.supervisorName || run.supervisorName,
            notes: `Packaging issue for Production Run ${run.runNumber} (${actualGoodOutput} packets)`,
          });
        }
      }

      // 5. Record damaged packaging separately as SCRAP_DISPOSAL
      if (damagedPackaging > 0) {
        const pouchMat = updatedMaterials.find((m) => m.itemType === 'PACKAGING_MATERIAL');
        if (pouchMat) {
          await InventoryService.recordStockMovement({
            itemId: pouchMat.materialId,
            movementType: 'SCRAP_DISPOSAL',
            sourceDocumentType: 'PRODUCTION_RUN',
            sourceDocumentId: run.runNumber,
            quantity: damagedPackaging,
            performedBy: req.supervisorId || run.supervisorId,
            performerName: req.supervisorName || run.supervisorName,
            notes: `Damaged packaging scrap during sealing for Run ${run.runNumber} (${damagedPackaging} pieces)`,
          });
        }
      }

      // 6. Add actual good packets to finished-goods inventory (FG_RECEIPT)
      await InventoryService.recordStockMovement({
        itemId: run.productId,
        movementType: 'FG_RECEIPT',
        sourceDocumentType: 'PRODUCTION_RUN',
        sourceDocumentId: run.runNumber,
        quantity: actualGoodOutput,
        unitCost: Number((totalDirectMaterialCost / actualGoodOutput).toFixed(4)),
        performedBy: req.supervisorId || run.supervisorId,
        performerName: req.supervisorName || run.supervisorName,
        notes: `Production output receipt for Run ${run.runNumber}: ${actualGoodOutput} good packets`,
      });
    } catch (error) {
      // Rollback snapshot on failure
      inventoryStore.items = itemsSnapshot;
      inventoryStore.ledger = ledgerSnapshot;
      throw error;
    }

    // -------------------------------------------------------------
    // Overhead Costs & Totals Calculation
    // -------------------------------------------------------------
    const labourCost = req.overheads?.labourCost || 0;
    const gasCost = req.overheads?.gasCost || 0;
    const electricityCost = req.overheads?.electricityCost || 0;
    const totalOverheadCost = Number((labourCost + gasCost + electricityCost).toFixed(2));
    const totalProductionCost = Number((totalDirectMaterialCost + totalOverheadCost).toFixed(2));
    const unitProductionCost = Number((totalProductionCost / actualGoodOutput).toFixed(4));

    // Update Production Run Object
    run.status = 'COMPLETED';
    run.materials = updatedMaterials;
    run.output = {
      plannedOutput,
      actualGoodOutput,
      damagedOutput,
      damagedPackagingQty: damagedPackaging,
      unitCode: run.output.unitCode,
      yieldPct,
      yieldVariancePct,
      isYieldAlert,
    };
    run.overheads = {
      labourCost,
      gasCost,
      electricityCost,
      totalOverheadCost,
    };
    run.varianceAlerts = varianceAlerts;
    run.totalDirectMaterialCost = Number(totalDirectMaterialCost.toFixed(2));
    run.totalProductionCost = totalProductionCost;
    run.unitProductionCost = unitProductionCost;
    run.postedAt = new Date().toISOString();
    run.postedBy = req.supervisorId || run.supervisorId;
    run.notes = req.notes || run.notes;
    run.updatedAt = new Date().toISOString();

    await recordSecurityAudit({
      userId: run.postedBy,
      entityName: 'PRODUCTION_RUN',
      entityId: run.id,
      actionType: 'POST',
      newValues: {
        runNumber: run.runNumber,
        actualGoodOutput,
        yieldVariancePct,
        varianceAlertCount: varianceAlerts.length,
        totalProductionCost,
      },
    });

    return run;
  }

  /**
   * Cancel a Planned or In-Progress Production Run
   */
  static async cancelProductionRun(runId: string, cancelledBy: string = 'usr-admin-01'): Promise<ProductionRunDTO> {
    const run = this.getProductionRunById(runId);
    if (run.status === 'COMPLETED') {
      throw new BadRequestError(`Cannot cancel completed and posted production run ${run.runNumber}`);
    }

    run.status = 'CANCELLED';
    run.updatedAt = new Date().toISOString();

    await recordSecurityAudit({
      userId: cancelledBy,
      entityName: 'PRODUCTION_RUN',
      entityId: run.id,
      actionType: 'CANCEL',
      newValues: {
        runNumber: run.runNumber,
        status: 'CANCELLED',
      },
    });

    return run;
  }

  // ==========================================
  // PART F: PRODUCTION DASHBOARD SUMMARY
  // ==========================================

  static getProductionDashboard(): ProductionDashboardSummary {
    const runs = Array.from(productionStore.runs.values());
    const totalRuns = runs.length;
    const plannedRuns = runs.filter((r) => r.status === 'PLANNED').length;
    const inProgressRuns = runs.filter((r) => r.status === 'IN_PROGRESS').length;
    const completedRuns = runs.filter((r) => r.status === 'COMPLETED').length;

    const completed = runs.filter((r) => r.status === 'COMPLETED');
    const totalPlannedOutput = completed.reduce((acc, curr) => acc + curr.output.plannedOutput, 0);
    const totalActualOutput = completed.reduce((acc, curr) => acc + curr.output.actualGoodOutput, 0);
    const averageYieldPct =
      totalPlannedOutput > 0 ? Number(((totalActualOutput / totalPlannedOutput) * 100).toFixed(2)) : 100.0;

    const allAlerts = runs.flatMap((r) => r.varianceAlerts);
    const totalVarianceAlerts = allAlerts.length;

    const recentRuns = [...runs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Finished Goods stock
    const fgItems = InventoryService.getStockBalances('FINISHED_GOODS');
    const finishedGoodsStock = fgItems.map((fg) => ({
      productCode: fg.itemCode,
      productName: fg.itemName,
      currentStock: fg.currentStock,
      unitCode: fg.unitCode,
      valuation: fg.totalValuation,
    }));

    return {
      totalRuns,
      plannedRuns,
      inProgressRuns,
      completedRuns,
      totalPlannedOutput,
      totalActualOutput,
      averageYieldPct,
      totalVarianceAlerts,
      recentRuns,
      activeAlerts: allAlerts.slice(0, 5),
      finishedGoodsStock,
    };
  }
}
