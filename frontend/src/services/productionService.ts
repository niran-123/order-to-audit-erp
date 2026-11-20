/**
 * Production & BOM Frontend API Service
 * Order-to-Audit Manufacturing ERP
 */

import api from './api';

export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface BOMItemDTO {
  id: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  materialId: string;
  materialCode: string;
  materialName: string;
  standardQty: number;
  unitCode: string;
  expectedWastagePct: number;
  unitCost: number;
  lineCost: number;
}

export interface BillOfMaterialDTO {
  id: string;
  bomNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  version: string;
  batchSize: number;
  batchUnit: string;
  expectedOutput: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveDate: string;
  items: BOMItemDTO[];
  totalRawMaterialCost: number;
  totalPackagingCost: number;
  totalBatchCost: number;
  costPerUnitOutput: number;
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
  varianceQty: number;
  variancePct: number;
  isVarianceAlert: boolean;
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
  runNumber: string;
  batchNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  bomId: string;
  bomVersion: string;
  plannedBatchSize: number;
  status: ProductionStatus;
  productionDate: string;
  materials: MaterialConsumptionDTO[];
  output: {
    plannedOutput: number;
    actualGoodOutput: number;
    damagedOutput: number;
    damagedPackagingQty: number;
    unitCode: string;
    yieldPct: number;
    yieldVariancePct: number;
    isYieldAlert: boolean;
  };
  overheads: {
    labourCost: number;
    gasCost: number;
    electricityCost: number;
    totalOverheadCost: number;
  };
  varianceAlerts: VarianceAlertDTO[];
  totalDirectMaterialCost: number;
  totalProductionCost: number;
  unitProductionCost: number;
  supervisorId: string;
  supervisorName: string;
  postedAt?: string;
  postedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateProductionRunRequest {
  productId: string;
  bomId: string;
  plannedBatchSize?: number;
  plannedOutput: number;
  productionDate?: string;
  supervisorId?: string;
  supervisorName?: string;
  notes?: string;
}

export interface CompleteProductionRunRequest {
  actualGoodOutput: number;
  damagedOutput?: number;
  damagedPackagingQty?: number;
  materials: {
    materialId: string;
    actualQty: number;
  }[];
  overheads?: {
    labourCost?: number;
    gasCost?: number;
    electricityCost?: number;
  };
  notes?: string;
}

export const productionService = {
  // Dashboard
  getDashboard: () =>
    api.get<{ success: boolean; data: ProductionDashboardSummary }>('/production/dashboard').then((res) => res.data.data),

  // BOMs
  listBOMs: (productId?: string) =>
    api.get<{ success: boolean; data: BillOfMaterialDTO[] }>('/bom', { params: { productId } }).then((res) => res.data.data),

  getBOMById: (id: string) =>
    api.get<{ success: boolean; data: BillOfMaterialDTO }>(`/bom/${id}`).then((res) => res.data.data),

  calculateRequirements: (bomId: string, plannedOutput: number) =>
    api.get<{ success: boolean; data: any[] }>(`/bom/${bomId}/requirements`, { params: { plannedOutput } }).then((res) => res.data.data),

  createBOM: (data: any) =>
    api.post<{ success: boolean; data: BillOfMaterialDTO }>('/bom', data).then((res) => res.data.data),

  // Production Runs
  listRuns: (params?: { status?: string; search?: string }) =>
    api.get<{ success: boolean; data: ProductionRunDTO[] }>('/production/runs', { params }).then((res) => res.data.data),

  getRunById: (id: string) =>
    api.get<{ success: boolean; data: ProductionRunDTO }>(`/production/runs/${id}`).then((res) => res.data.data),

  createRun: (data: CreateProductionRunRequest) =>
    api.post<{ success: boolean; data: ProductionRunDTO }>('/production/runs', data).then((res) => res.data.data),

  completeAndPostRun: (id: string, data: CompleteProductionRunRequest, tolerance?: number) =>
    api
      .post<{ success: boolean; data: ProductionRunDTO }>(`/production/runs/${id}/complete`, data, {
        params: { tolerance },
      })
      .then((res) => res.data.data),

  cancelRun: (id: string) =>
    api.post<{ success: boolean; data: ProductionRunDTO }>(`/production/runs/${id}/cancel`).then((res) => res.data.data),
};
