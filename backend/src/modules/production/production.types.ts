/**
 * Bill of Materials (BOM) & Production Management System Types
 * Order-to-Audit Manufacturing ERP
 */

import { InventoryCategory } from '../inventory/inventory.types';

export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface BOMItemDTO {
  id: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  materialId: string;
  materialCode: string;
  materialName: string;
  standardQty: number; // e.g. 40 kg flour for 200 packets
  unitCode: string; // KG, LTR, PCS, etc.
  expectedWastagePct: number; // e.g. 1%
  unitCost: number; // prevailing rate
  lineCost: number; // standardQty * unitCost
}

export interface BillOfMaterialDTO {
  id: string;
  bomNumber: string; // e.g. BOM-MUR-200G-V1
  productId: string;
  productCode: string;
  productName: string;
  version: string; // "V1.0", "V2.0"
  batchSize: number; // e.g. 200
  batchUnit: string; // PKT
  expectedOutput: number; // 200 packets
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveDate: string;
  items: BOMItemDTO[];
  totalRawMaterialCost: number;
  totalPackagingCost: number;
  totalBatchCost: number;
  costPerUnitOutput: number; // totalBatchCost / expectedOutput
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialConsumptionDTO {
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  materialId: string;
  materialCode: string;
  materialName: string;
  plannedQty: number;
  actualQty: number;
  unitCode: string;
  unitCost: number;
  varianceQty: number; // actualQty - plannedQty
  variancePct: number; // ((actualQty - plannedQty) / plannedQty) * 100
  isVarianceAlert: boolean; // exceeds tolerance (default 3%)
}

export interface OverheadCostDTO {
  labourCost: number;
  gasCost: number;
  electricityCost: number;
  totalOverheadCost: number;
}

export interface ProductionOutputDTO {
  plannedOutput: number; // e.g. 200 packets
  actualGoodOutput: number; // e.g. 188 packets
  damagedOutput: number; // e.g. 12 packets
  damagedPackagingQty: number; // e.g. 6 pieces
  unitCode: string; // PKT
  yieldPct: number; // (actualGoodOutput / plannedOutput) * 100
  yieldVariancePct: number; // ((actualGoodOutput - plannedOutput) / plannedOutput) * 100
  isYieldAlert: boolean; // yield variance < -tolerance% or > tolerance%
}

export interface VarianceAlertDTO {
  type: 'CONSUMPTION' | 'YIELD';
  itemCode: string;
  itemName: string;
  planned: number;
  actual: number;
  unitCode: string;
  variancePct: number;
  thresholdPct: number;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
}

export interface ProductionRunDTO {
  id: string;
  runNumber: string; // RUN-2026-00001
  batchNumber: string; // BATCH-2026-1120-01
  productId: string;
  productCode: string;
  productName: string;
  bomId: string;
  bomVersion: string;
  plannedBatchSize: number;
  status: ProductionStatus;
  productionDate: string;
  materials: MaterialConsumptionDTO[];
  output: ProductionOutputDTO;
  overheads: OverheadCostDTO;
  varianceAlerts: VarianceAlertDTO[];
  totalDirectMaterialCost: number;
  totalProductionCost: number; // materials + overheads
  unitProductionCost: number; // totalProductionCost / actualGoodOutput
  supervisorId: string;
  supervisorName: string;
  postedAt?: string;
  postedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBOMRequest {
  productId: string;
  version: string;
  batchSize: number;
  batchUnit: string;
  expectedOutput: number;
  effectiveDate?: string;
  items: {
    itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
    materialId: string;
    standardQty: number;
    unitCode: string;
    expectedWastagePct?: number;
  }[];
  notes?: string;
}

export interface CreateProductionRunRequest {
  productId: string;
  bomId: string;
  plannedBatchSize?: number;
  plannedOutput: number; // e.g. 200
  productionDate?: string;
  supervisorId: string;
  supervisorName?: string;
  notes?: string;
}

export interface CompleteProductionRunRequest {
  actualGoodOutput: number; // e.g. 188
  damagedOutput?: number; // e.g. 12
  damagedPackagingQty?: number; // e.g. 6 damaged pouches
  materials: {
    materialId: string;
    actualQty: number; // actual issued/consumed
  }[];
  overheads?: {
    labourCost?: number;
    gasCost?: number;
    electricityCost?: number;
  };
  supervisorId: string;
  supervisorName?: string;
  notes?: string;
}

export interface ProductionDashboardSummary {
  totalRuns: number;
  plannedRuns: number;
  inProgressRuns: number;
  completedRuns: number;
  totalPlannedOutput: number;
  totalActualOutput: number;
  averageYieldPct: number;
  totalVarianceAlerts: number;
  recentRuns: ProductionRunDTO[];
  activeAlerts: VarianceAlertDTO[];
  finishedGoodsStock: {
    productCode: string;
    productName: string;
    currentStock: number;
    unitCode: string;
    valuation: number;
  }[];
}
