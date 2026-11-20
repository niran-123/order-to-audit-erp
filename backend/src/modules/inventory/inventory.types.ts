/**
 * Inventory & Purchase Management System Types
 * Order-to-Audit Manufacturing ERP
 */

export type InventoryCategory = 'RAW_MATERIAL' | 'PACKAGING_MATERIAL' | 'WORK_IN_PROGRESS' | 'FINISHED_GOODS';

export type StockMovementType =
  | 'OPENING_BALANCE'
  | 'GRN_RECEIPT'
  | 'PRODUCTION_ISSUE'
  | 'PRODUCTION_RETURN'
  | 'FG_RECEIPT'
  | 'DISPATCH_OUT'
  | 'STOCK_ADJUSTMENT'
  | 'SCRAP_DISPOSAL';

export type SourceDocumentType =
  | 'OPENING_SETUP'
  | 'PURCHASE_GRN'
  | 'PRODUCTION_RUN'
  | 'SALES_DISPATCH'
  | 'STOCK_RECONCILIATION';

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
  currentStock: number; // Closing Balance = Opening + Receipts - Issues - Sales + Returns ± Adjustments
  reorderLevel: number;
  safetyStock: number;
  averageCost: number; // Weighted-Average Unit Cost (INR)
  totalValuation: number; // currentStock * averageCost
  isLowStock: boolean;
  lastUpdated: string;
}

export interface StockLedgerEntry {
  id: string; // Movement ID
  transactionId: string; // TXN- / MVMT-
  itemId: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  movementType: StockMovementType;
  sourceDocumentType: SourceDocumentType;
  sourceDocumentId: string; // PO#, Run#, Dispatch#, Reconcile#
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

export interface StockReconciliationRequest {
  itemId: string;
  physicalCount: number;
  reason: string;
  performedBy: string;
}

export type PurchaseStatus = 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItemDTO {
  id: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  materialId: string;
  materialCode: string;
  materialName: string;
  orderedQty: number;
  unitCode: string;
  unitPrice: number;
  taxRate: number; // e.g. 5, 12, 18 %
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
  status: PurchaseStatus;
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
