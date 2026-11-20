/**
 * Inventory & Purchasing Frontend API Service
 * Order-to-Audit Manufacturing ERP
 */

import api from './api';

export type InventoryCategory = 'RAW_MATERIAL' | 'PACKAGING_MATERIAL' | 'WORK_IN_PROGRESS' | 'FINISHED_GOODS';

export interface InventoryItemState {
  id: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  unitCode: string;
  storageLocation: string;
  openingBalance: number;
  totalReceipts: number;
  totalIssues: number;
  totalSalesDispatched: number;
  totalReturns: number;
  totalAdjustments: number;
  currentStock: number;
  reorderLevel: number;
  safetyStock: number;
  averageCost: number;
  totalValuation: number;
  isLowStock: boolean;
  lastUpdated: string;
}

export interface StockLedgerEntry {
  id: string;
  transactionId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  movementType: string;
  sourceDocumentType: string;
  sourceDocumentId: string;
  quantityIn: number;
  quantityOut: number;
  runningBalance: number;
  unitCost: number;
  totalValue: number;
  unitCode: string;
  location: string;
  performedBy: string;
  performerName?: string;
  timestamp: string;
  notes?: string;
}

export interface InventoryDashboardSummary {
  categorySummaries: {
    category: InventoryCategory;
    itemCount: number;
    totalStockQuantity: number;
    totalValuation: number;
    lowStockCount: number;
  }[];
  totalInventoryValuation: number;
  totalActiveItems: number;
  totalLowStockItems: number;
  recentMovements: StockLedgerEntry[];
}

export interface PurchaseItemDTO {
  id: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  materialId: string;
  materialCode: string;
  materialName: string;
  orderedQty: number;
  unitCode: string;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  items: PurchaseItemDTO[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  grnNumber?: string;
  receivedAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  supplierInvoiceNumber?: string;
  items: {
    itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
    materialId: string;
    orderedQty: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}

export interface StockReconciliationRequest {
  itemId: string;
  physicalCount: number;
  reason: string;
}

export const inventoryService = {
  // Dashboard Summary
  getDashboard: () =>
    api.get<{ success: boolean; data: InventoryDashboardSummary }>('/inventory/dashboard').then((res) => res.data.data),

  // Stock Balances
  getBalances: (params?: { category?: InventoryCategory; search?: string }) =>
    api
      .get<{ success: boolean; data: InventoryItemState[] }>('/inventory/balances', { params })
      .then((res) => res.data.data),

  // Stock Ledger with Running Balances
  getLedger: (params?: {
    itemId?: string;
    category?: InventoryCategory;
    movementType?: string;
    sourceDocumentType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{
        success: boolean;
        items: StockLedgerEntry[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/inventory/ledger', { params })
      .then((res) => res.data),

  // Physical Stock Reconciliation
  reconcileStock: (data: StockReconciliationRequest) =>
    api.post<{ success: boolean; data: StockLedgerEntry }>('/inventory/reconcile', data).then((res) => res.data.data),

  // Purchases
  getPurchases: (params?: { status?: string; supplierId?: string; search?: string }) =>
    api
      .get<{ success: boolean; data: PurchaseOrderDTO[] }>('/purchases', { params })
      .then((res) => res.data.data),

  getPurchaseById: (id: string) =>
    api.get<{ success: boolean; data: PurchaseOrderDTO }>(`/purchases/${id}`).then((res) => res.data.data),

  createPurchase: (data: CreatePurchaseRequest) =>
    api.post<{ success: boolean; data: PurchaseOrderDTO }>('/purchases', data).then((res) => res.data.data),

  confirmPurchase: (id: string, data?: { supplierInvoiceNumber?: string }) =>
    api.post<{ success: boolean; data: PurchaseOrderDTO }>(`/purchases/${id}/confirm`, data || {}).then((res) => res.data.data),
};
