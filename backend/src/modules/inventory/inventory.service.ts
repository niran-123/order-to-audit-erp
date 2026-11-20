/**
 * Inventory Management System Service
 * Order-to-Audit Manufacturing ERP
 * 
 * Strict Invariants Enforced:
 * 1. Balance Formula: Opening + Receipts - Issues - Sales + Returns ± Adjustments = Closing
 * 2. Finished goods only decrease through confirmed dispatches (DISPATCH_OUT), never on order creation
 * 3. Weighted-Average Costing:
 *    (CurrentStock * CurrentAvgCost + InQty * InRate) / (CurrentStock + InQty)
 *    Benchmark Flour: (100 * 42 + 60 * 45) / 160 = 43.125 INR/kg
 * 4. Negative stock strictly rejected
 * 5. Duplicate movement rejection via unique movement/transaction keys
 * 6. Never directly mutate stock balances without an immutable StockLedgerEntry
 */

import {
  InventoryCategory,
  InventoryItemState,
  StockLedgerEntry,
  StockMovementType,
  SourceDocumentType,
  StockReconciliationRequest,
  InventoryDashboardSummary,
} from './inventory.types';
import { BENCHMARK_INVENTORY_ITEMS, BENCHMARK_OPENING_LEDGER } from './inventory.benchmark';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/appError';
import { recordSecurityAudit } from '../audit/audit.service';

export interface RecordMovementParams {
  itemId: string;
  movementType: StockMovementType;
  sourceDocumentType: SourceDocumentType;
  sourceDocumentId: string;
  quantity: number; // positive number
  unitCost?: number; // for receipts; issues default to weighted-average cost
  location?: string;
  performedBy: string;
  performerName?: string;
  notes?: string;
}

class InventoryStore {
  public items: Map<string, InventoryItemState> = new Map();
  public ledger: StockLedgerEntry[] = [];
  public movementKeys: Set<string> = new Set();
  public sequence: number = 100;

  constructor() {
    this.resetToBenchmark();
  }

  public resetToBenchmark() {
    this.items.clear();
    this.ledger = [];
    this.movementKeys.clear();
    this.sequence = 100;

    // Deep clone benchmark items
    for (const item of BENCHMARK_INVENTORY_ITEMS) {
      this.items.set(item.id, JSON.parse(JSON.stringify(item)));
    }

    // Deep clone benchmark ledger
    for (const entry of BENCHMARK_OPENING_LEDGER) {
      this.ledger.push(JSON.parse(JSON.stringify(entry)));
      this.movementKeys.add(`${entry.sourceDocumentType}:${entry.sourceDocumentId}:${entry.itemId}:${entry.movementType}`);
    }
  }
}

export const inventoryStore = new InventoryStore();

export class InventoryService {
  /**
   * Reset store to benchmark data (used in test setup / verification)
   */
  static resetBenchmark() {
    inventoryStore.resetToBenchmark();
  }

  /**
   * 1. GET INVENTORY DASHBOARD SUMMARY
   * Grouped by the 4 required categories with low stock counts and total valuations.
   */
  static getInventoryDashboard(): InventoryDashboardSummary {
    const items = Array.from(inventoryStore.items.values());
    const categories: InventoryCategory[] = [
      'RAW_MATERIAL',
      'PACKAGING_MATERIAL',
      'WORK_IN_PROGRESS',
      'FINISHED_GOODS',
    ];

    const categorySummaries = categories.map((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      const itemCount = catItems.length;
      const totalStockQuantity = Number(
        catItems.reduce((acc, curr) => acc + curr.currentStock, 0).toFixed(4)
      );
      const totalValuation = Number(
        catItems.reduce((acc, curr) => acc + curr.totalValuation, 0).toFixed(2)
      );
      const lowStockCount = catItems.filter((i) => i.isLowStock).length;

      return {
        category: cat,
        itemCount,
        totalStockQuantity,
        totalValuation,
        lowStockCount,
      };
    });

    const totalInventoryValuation = Number(
      items.reduce((acc, curr) => acc + curr.totalValuation, 0).toFixed(2)
    );
    const totalActiveItems = items.length;
    const totalLowStockItems = items.filter((i) => i.isLowStock).length;
    const recentMovements = [...inventoryStore.ledger]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      categorySummaries,
      totalInventoryValuation,
      totalActiveItems,
      totalLowStockItems,
      recentMovements,
    };
  }

  /**
   * 2. LIST STOCK BALANCES
   * Displays Opening, Receipts, Issues, Sales, Returns, Adjustments, and Closing balance
   */
  static getStockBalances(category?: InventoryCategory, search?: string): InventoryItemState[] {
    let items = Array.from(inventoryStore.items.values());

    if (category) {
      items = items.filter((item) => item.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.itemCode.toLowerCase().includes(q) ||
          item.itemName.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q)
      );
    }

    return items;
  }

  /**
   * 3. GET SINGLE ITEM STOCK DETAILS
   */
  static getItemById(id: string): InventoryItemState {
    const item = inventoryStore.items.get(id);
    if (!item) {
      // Also lookup by itemCode
      const byCode = Array.from(inventoryStore.items.values()).find(
        (i) => i.itemCode === id || i.id === id
      );
      if (!byCode) {
        throw new NotFoundError(`Inventory item not found for id/code: ${id}`);
      }
      return byCode;
    }
    return item;
  }

  /**
   * 4. RECORD STOCK MOVEMENT (The single source of truth for all stock balance changes)
   * Enforces:
   * - Invariant mathematical formula
   * - No negative stock
   * - Weighted-Average Valuation
   * - Duplicate movement prevention
   * - Ledger entry creation
   */
  static async recordStockMovement(params: RecordMovementParams): Promise<StockLedgerEntry> {
    const item = this.getItemById(params.itemId);

    if (params.quantity <= 0) {
      throw new BadRequestError('Movement quantity must be strictly greater than zero');
    }

    // 1. Duplicate check (Idempotency)
    const idempotencyKey = `${params.sourceDocumentType}:${params.sourceDocumentId}:${item.id}:${params.movementType}`;
    if (inventoryStore.movementKeys.has(idempotencyKey)) {
      throw new ConflictError(
        `Duplicate stock movement rejected: Document ${params.sourceDocumentId} already has recorded movement for ${item.itemCode}`
      );
    }

    // 2. Classify Inflow vs Outflow
    let isReceipt = false;
    let isIssue = false;
    let isAdjustment = false;
    let isDispatch = false;
    let isReturn = false;

    switch (params.movementType) {
      case 'OPENING_BALANCE':
      case 'GRN_RECEIPT':
      case 'FG_RECEIPT':
        isReceipt = true;
        break;
      case 'PRODUCTION_RETURN':
        isReturn = true;
        break;
      case 'PRODUCTION_ISSUE':
      case 'SCRAP_DISPOSAL':
        isIssue = true;
        break;
      case 'DISPATCH_OUT':
        isDispatch = true;
        break;
      case 'STOCK_ADJUSTMENT':
        isAdjustment = true;
        break;
      default:
        throw new BadRequestError(`Unsupported stock movement type: ${params.movementType}`);
    }

    // 3. Negative Stock Prevention Check
    const qtyOut = isIssue || isDispatch ? params.quantity : 0;
    if (qtyOut > 0 && item.currentStock < qtyOut) {
      throw new BadRequestError(
        `Insufficient available stock for ${item.itemName} (${item.itemCode}): Current stock is ${item.currentStock} ${item.unitCode}, cannot issue ${qtyOut} ${item.unitCode}`
      );
    }

    // 4. Cost Valuation
    let effectiveUnitCost = item.averageCost;
    if (isReceipt && params.unitCost !== undefined) {
      effectiveUnitCost = params.unitCost;
      // Recalculate Weighted-Average Cost on Inflow:
      // (currentStock * currentAvgCost + incomingQty * incomingRate) / (currentStock + incomingQty)
      const currentValuation = item.currentStock * item.averageCost;
      const incomingValuation = params.quantity * params.unitCost;
      const newTotalStock = item.currentStock + params.quantity;
      if (newTotalStock > 0) {
        const newWeightedAvg = (currentValuation + incomingValuation) / newTotalStock;
        // Round to 4 decimal places for precision
        item.averageCost = Number(newWeightedAvg.toFixed(4));
      }
    } else if (isIssue || isDispatch) {
      // Outflows are ALWAYS valued at the prevailing weighted-average unit cost
      effectiveUnitCost = item.averageCost;
    }

    // 5. Update Cumulative Bucket Metrics
    const qtyIn = isReceipt || isReturn ? params.quantity : 0;
    if (isReceipt) item.totalReceipts += qtyIn;
    if (isReturn) item.totalReturns += qtyIn;
    if (isIssue) item.totalIssues += qtyOut;
    if (isDispatch) item.totalSalesDispatched += qtyOut;

    // Adjustments can be positive or negative
    if (isAdjustment) {
      // In params, if it's an adjustment, notes or caller indicates direction
      // If caller passed notes containing '[NEGATIVE_VARIANCE]', it's a downward adjustment
      const isNegativeAdj = params.notes?.includes('[NEGATIVE_VARIANCE]');
      if (isNegativeAdj) {
        if (item.currentStock < params.quantity) {
          throw new BadRequestError(
            `Cannot adjust downwards: Stock is ${item.currentStock}, adjustment is ${params.quantity}`
          );
        }
        item.totalAdjustments -= params.quantity;
      } else {
        item.totalAdjustments += params.quantity;
      }
    }

    // 6. Enforce Mathematical Invariant Formula:
    // Opening Balance + Receipts - Issues - Sales + Returns ± Adjustments = Closing Balance
    const calculatedClosing = Number(
      (
        item.openingBalance +
        item.totalReceipts -
        item.totalIssues -
        item.totalSalesDispatched +
        item.totalReturns +
        item.totalAdjustments
      ).toFixed(4)
    );

    item.currentStock = Math.max(0, calculatedClosing);
    item.totalValuation = Number((item.currentStock * item.averageCost).toFixed(2));
    item.isLowStock = item.currentStock <= item.reorderLevel;
    item.lastUpdated = new Date().toISOString();

    // 7. Generate Ledger Entry
    inventoryStore.sequence += 1;
    const transactionId = `TXN-INV-${new Date().getFullYear()}-${inventoryStore.sequence.toString().padStart(5, '0')}`;
    const ledgerEntry: StockLedgerEntry = {
      id: `mvmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionId,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      movementType: params.movementType,
      sourceDocumentType: params.sourceDocumentType,
      sourceDocumentId: params.sourceDocumentId,
      quantityIn: qtyIn > 0 ? qtyIn : isAdjustment && !params.notes?.includes('[NEGATIVE_VARIANCE]') ? params.quantity : 0,
      quantityOut: qtyOut > 0 ? qtyOut : isAdjustment && params.notes?.includes('[NEGATIVE_VARIANCE]') ? params.quantity : 0,
      runningBalance: item.currentStock,
      unitCost: effectiveUnitCost,
      totalValue: Number((params.quantity * effectiveUnitCost).toFixed(2)),
      unitCode: item.unitCode,
      location: params.location || item.storageLocation,
      performedBy: params.performedBy,
      performerName: params.performerName || 'Production Supervisor',
      timestamp: new Date().toISOString(),
      notes: params.notes,
    };

    inventoryStore.ledger.push(ledgerEntry);
    inventoryStore.movementKeys.add(idempotencyKey);

    // 8. Log Audit Trail
    await recordSecurityAudit({
      userId: params.performedBy,
      entityName: 'INVENTORY_LEDGER',
      entityId: transactionId,
      actionType: 'POST',
      newValues: {
        transactionId,
        itemCode: item.itemCode,
        movementType: params.movementType,
        quantity: params.quantity,
        runningBalance: item.currentStock,
        sourceDocument: `${params.sourceDocumentType}#${params.sourceDocumentId}`,
        newAverageCost: item.averageCost,
      },
    });

    return ledgerEntry;
  }

  /**
   * 5. GET STOCK LEDGER
   * Paginated and filterable transaction audit trail with running balances
   */
  static getStockLedger(filters: {
    itemId?: string;
    category?: InventoryCategory;
    movementType?: StockMovementType;
    sourceDocumentType?: SourceDocumentType;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...inventoryStore.ledger].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filters.itemId) {
      list = list.filter((e) => e.itemId === filters.itemId || e.itemCode === filters.itemId);
    }

    if (filters.category) {
      list = list.filter((e) => e.category === filters.category);
    }

    if (filters.movementType) {
      list = list.filter((e) => e.movementType === filters.movementType);
    }

    if (filters.sourceDocumentType) {
      list = list.filter((e) => e.sourceDocumentType === filters.sourceDocumentType);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.transactionId.toLowerCase().includes(q) ||
          e.itemCode.toLowerCase().includes(q) ||
          e.itemName.toLowerCase().includes(q) ||
          e.sourceDocumentId.toLowerCase().includes(q)
      );
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const items = list.slice((page - 1) * limit, page * limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 6. STOCK RECONCILIATION
   * Compare physical counted quantity with recorded current stock.
   * Creates an immutable STOCK_ADJUSTMENT ledger entry.
   */
  static async reconcileStock(request: StockReconciliationRequest): Promise<StockLedgerEntry> {
    const item = this.getItemById(request.itemId);
    const diff = Number((request.physicalCount - item.currentStock).toFixed(4));

    if (diff === 0) {
      throw new BadRequestError('Physical count matches system stock exactly. No adjustment required.');
    }

    const isNegative = diff < 0;
    const absDiff = Math.abs(diff);
    const notePrefix = isNegative ? '[NEGATIVE_VARIANCE]' : '[POSITIVE_VARIANCE]';
    const notes = `${notePrefix} Physical count variance: Expected ${item.currentStock} ${item.unitCode}, Counted ${request.physicalCount} ${item.unitCode}. Reason: ${request.reason}`;

    const reconcileDocId = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    return await this.recordStockMovement({
      itemId: item.id,
      movementType: 'STOCK_ADJUSTMENT',
      sourceDocumentType: 'STOCK_RECONCILIATION',
      sourceDocumentId: reconcileDocId,
      quantity: absDiff,
      performedBy: request.performedBy,
      notes,
    });
  }

  /**
   * 7. DISPATCH FINISHED GOODS
   * Decrements FG stock ONLY through a confirmed dispatch document.
   */
  static async dispatchFinishedGoods(params: {
    productId: string;
    dispatchChallanId: string;
    quantity: number;
    performedBy: string;
    customerName?: string;
  }): Promise<StockLedgerEntry> {
    const item = this.getItemById(params.productId);
    if (item.category !== 'FINISHED_GOODS') {
      throw new BadRequestError(`Cannot dispatch item ${item.itemCode}: only FINISHED_GOODS can be dispatched`);
    }

    return await this.recordStockMovement({
      itemId: item.id,
      movementType: 'DISPATCH_OUT',
      sourceDocumentType: 'SALES_DISPATCH',
      sourceDocumentId: params.dispatchChallanId,
      quantity: params.quantity,
      performedBy: params.performedBy,
      notes: `Confirmed Dispatch to ${params.customerName || 'Customer'} via DC #${params.dispatchChallanId}`,
    });
  }

  /**
   * 8. ISSUE RAW MATERIAL TO PRODUCTION
   */
  static async issueMaterialToProduction(params: {
    materialId: string;
    productionRunId: string;
    quantity: number;
    performedBy: string;
  }): Promise<StockLedgerEntry> {
    const item = this.getItemById(params.materialId);
    if (item.category !== 'RAW_MATERIAL' && item.category !== 'PACKAGING_MATERIAL') {
      throw new BadRequestError(`Cannot issue ${item.category} to production floor`);
    }

    return await this.recordStockMovement({
      itemId: item.id,
      movementType: 'PRODUCTION_ISSUE',
      sourceDocumentType: 'PRODUCTION_RUN',
      sourceDocumentId: params.productionRunId,
      quantity: params.quantity,
      performedBy: params.performedBy,
      notes: `Batch material issue for Production Run ${params.productionRunId}`,
    });
  }
}
