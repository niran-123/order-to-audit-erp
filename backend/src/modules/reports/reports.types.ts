/**
 * BI & Reporting Types
 * Order-to-Audit Manufacturing ERP
 *
 * Types for all 17 Accountant/Auditor Reports, Audit Trail, and Executive Dashboards.
 */

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  productId?: string;
  supplierId?: string;
  transactionType?: string;
  status?: string;
  search?: string;
}

// ----------------------------------------------------
// 1. Sales Register Report
// ----------------------------------------------------
export interface SalesRegisterRow {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  customerCode: string;
  customerName: string;
  customerGSTIN: string;
  placeOfSupply: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  status: string;
}

export interface SalesRegisterReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalInvoices: number;
    totalTaxableAmount: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalTax: number;
    grandTotal: number;
  };
  rows: SalesRegisterRow[];
}

// ----------------------------------------------------
// 2. Customer-wise Sales Report
// ----------------------------------------------------
export interface CustomerSalesRow {
  customerCode: string;
  customerName: string;
  customerType: string;
  state: string;
  gstin: string;
  ordersCount: number;
  invoicesCount: number;
  totalUnitsSold: number;
  taxableAmount: number;
  totalTax: number;
  totalInvoicedAmount: number;
  averageOrderValue: number;
}

export interface CustomerSalesReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalCustomers: number;
    totalOrders: number;
    totalInvoices: number;
    totalInvoicedAmount: number;
    averageOrderValue: number;
  };
  rows: CustomerSalesRow[];
}

// ----------------------------------------------------
// 3. Product-wise Sales Report
// ----------------------------------------------------
export interface ProductSalesRow {
  productCode: string;
  productName: string;
  hsnCode: string;
  packSize: string;
  unit: string;
  quantitySold: number;
  averageRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalRevenue: number;
}

export interface ProductSalesReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalProductsSold: number;
    totalQuantitySold: number;
    totalTaxableAmount: number;
    totalRevenue: number;
  };
  rows: ProductSalesRow[];
}

// ----------------------------------------------------
// 4. GST Outward Supplies Summary (GSTR-1 Format)
// ----------------------------------------------------
export interface GSTOutwardItem {
  supplyType: 'INTRA_STATE' | 'INTER_STATE';
  hsnCode: string;
  ratePct: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  invoiceCount: number;
}

export interface GSTOutwardSuppliesReport {
  generatedAt: string;
  filters: ReportFilterParams;
  intraState: {
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    totalTax: number;
    invoiceCount: number;
  };
  interState: {
    taxableValue: number;
    igstAmount: number;
    totalTax: number;
    invoiceCount: number;
  };
  grandTotal: {
    taxableValue: number;
    totalTax: number;
    totalInvoiceValue: number;
    totalInvoices: number;
  };
  breakdown: GSTOutwardItem[];
}

// ----------------------------------------------------
// 5. Purchase Register
// ----------------------------------------------------
export interface PurchaseRegisterRow {
  poNumber: string;
  grnNumber: string;
  supplierInvoiceNumber: string;
  orderDate: string;
  receivedDate: string;
  supplierCode: string;
  supplierName: string;
  itemCount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
}

export interface PurchaseRegisterReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalPurchases: number;
    totalTaxableAmount: number;
    totalTaxAmount: number;
    grandTotal: number;
    grnReceivedCount: number;
  };
  rows: PurchaseRegisterRow[];
}

// ----------------------------------------------------
// 6 & 7. Raw Material & Packaging Stock Summary
// ----------------------------------------------------
export interface MaterialStockSummaryRow {
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  reorderLevel: number;
  weightedAvgCost: number;
  totalValuation: number;
  stockStatus: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK';
}

export interface MaterialStockSummaryReport {
  generatedAt: string;
  category: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  summary: {
    totalItems: number;
    healthyCount: number;
    lowStockCount: number;
    criticalCount: number;
    totalValuation: number;
  };
  rows: MaterialStockSummaryRow[];
}

// ----------------------------------------------------
// 8. Finished Goods Stock Summary
// ----------------------------------------------------
export interface FGStockSummaryRow {
  productCode: string;
  productName: string;
  unit: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  reorderLevel: number;
  productionCostPerUnit: number;
  sellingPrice: number;
  inventoryValuationCost: number;
  inventoryValuationRetail: number;
  stockStatus: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK';
}

export interface FGStockSummaryReport {
  generatedAt: string;
  summary: {
    totalProducts: number;
    totalGoodPacketsInStock: number;
    totalAvailablePackets: number;
    totalValuationCostBasis: number;
    totalValuationRetailBasis: number;
  };
  rows: FGStockSummaryRow[];
}

// ----------------------------------------------------
// 9. Complete Stock Ledger (Perpetual Inventory Log)
// ----------------------------------------------------
export interface StockLedgerRow {
  id: string;
  timestamp: string;
  itemCode: string;
  itemName: string;
  category: string;
  movementType: string;
  sourceDocumentType: string;
  sourceDocumentId: string;
  inQuantity: number;
  outQuantity: number;
  balanceQuantity: number;
  unitCost: number;
  totalCost: number;
  performerName: string;
  notes?: string;
}

export interface CompleteStockLedgerReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalEntries: number;
    totalInflowQty: number;
    totalOutflowQty: number;
  };
  rows: StockLedgerRow[];
}

// ----------------------------------------------------
// 10. Production Report
// ----------------------------------------------------
export interface ProductionReportRow {
  runNumber: string;
  batchNumber: string;
  productCode: string;
  productName: string;
  productionDate: string;
  supervisorName: string;
  plannedBatchSize: number;
  plannedOutput: number;
  actualOutput: number;
  goodPackets: number;
  damagedPackets: number;
  scrapPouches: number;
  status: string;
  totalDirectMaterialCost: number;
  totalOverheadsCost: number;
  totalProductionCost: number;
  unitCost: number;
}

export interface ProductionReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalRuns: number;
    totalPlannedOutput: number;
    totalActualGoodOutput: number;
    totalDamagedPackets: number;
    totalScrapPouches: number;
    totalProductionCost: number;
    averageYieldPct: number;
  };
  rows: ProductionReportRow[];
}

// ----------------------------------------------------
// 11. Planned vs Actual Consumption Report
// ----------------------------------------------------
export interface ConsumptionVarianceRow {
  runNumber: string;
  productName: string;
  materialCode: string;
  materialName: string;
  materialCategory: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  unit: string;
  plannedQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  variancePercentage: number;
  hasAlert: boolean;
  unitRate: number;
  varianceCost: number;
}

export interface PlannedVsActualConsumptionReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalItemsCompared: number;
    totalVarianceAlerts: number;
    totalNetVarianceCost: number;
  };
  rows: ConsumptionVarianceRow[];
}

// ----------------------------------------------------
// 12. Production Yield Report
// ----------------------------------------------------
export interface YieldReportRow {
  runNumber: string;
  batchNumber: string;
  productName: string;
  productionDate: string;
  plannedOutput: number;
  actualGoodPackets: number;
  damagedPackets: number;
  yieldPercentage: number;
  yieldVariancePercentage: number;
  hasYieldAlert: boolean;
  alertReason?: string;
}

export interface ProductionYieldReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalRunsEvaluated: number;
    averageYieldPercentage: number;
    runsWithAlerts: number;
    highestYieldPercentage: number;
    lowestYieldPercentage: number;
  };
  rows: YieldReportRow[];
}

// ----------------------------------------------------
// 13. Wastage Report
// ----------------------------------------------------
export interface WastageReportRow {
  runNumber: string;
  batchNumber: string;
  productName: string;
  productionDate: string;
  damagedFinishedPackets: number;
  damagedPacketsWastageCost: number;
  damagedPackagingPouches: number;
  pouchesWastageCost: number;
  totalWastageCost: number;
  wastagePercentageOfBatch: number;
}

export interface WastageReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalDamagedPackets: number;
    totalPouchesScrapped: number;
    totalWastageValue: number;
    averageWastagePercentage: number;
  };
  rows: WastageReportRow[];
}

// ----------------------------------------------------
// 14. Cost Per Packet Report
// ----------------------------------------------------
export interface CostPerPacketRow {
  runNumber: string;
  batchNumber: string;
  productName: string;
  goodPacketsCount: number;
  rawMaterialCost: number;
  packagingMaterialCost: number;
  totalDirectMaterialCost: number;
  materialCostPerPacket: number;
  directLabourCost: number;
  gasFuelCost: number;
  electricityCost: number;
  otherOverheadsCost: number;
  totalOverheadsCost: number;
  overheadCostPerPacket: number;
  totalBatchCost: number;
  finalCostPerGoodPacket: number;
}

export interface CostPerPacketReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalGoodPacketsProduced: number;
    totalCostAbsorbed: number;
    averageCostPerGoodPacket: number;
    averageMaterialCostPerPacket: number;
    averageOverheadCostPerPacket: number;
  };
  rows: CostPerPacketRow[];
}

// ----------------------------------------------------
// 15. Payments and Collections Report
// ----------------------------------------------------
export interface PaymentCollectionRow {
  paymentNumber: string;
  paymentDate: string;
  customerCode: string;
  customerName: string;
  paymentMethod: string;
  referenceNumber: string;
  amountReceived: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  status: string;
  allocatedInvoices: string;
}

export interface PaymentsCollectionsReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalPaymentsCount: number;
    totalAmountReceived: number;
    totalAmountAllocated: number;
    totalAmountUnallocated: number;
  };
  rows: PaymentCollectionRow[];
}

// ----------------------------------------------------
// 16. Customer Outstanding Report
// ----------------------------------------------------
export interface CustomerOutstandingRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  phone: string;
  totalInvoiced: number;
  totalPaid: number;
  netOutstanding: number;
  activeInvoicesCount: number;
  oldestInvoiceDays: number;
}

export interface CustomerOutstandingReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalCustomersWithBalance: number;
    totalInvoicedOverall: number;
    totalPaidOverall: number;
    totalNetOutstanding: number;
  };
  rows: CustomerOutstandingRow[];
}

// ----------------------------------------------------
// 17. Receivables Ageing Report
// ----------------------------------------------------
export interface AgeingReportRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  bracket0To30: number;
  bracket31To60: number;
  bracket61To90: number;
  bracketAbove90: number;
  totalOutstanding: number;
}

export interface ReceivablesAgeingReport {
  generatedAt: string;
  summary: {
    totalReceivables: number;
    bracket0To30: number;
    bracket31To60: number;
    bracket61To90: number;
    bracketAbove90: number;
  };
  rows: AgeingReportRow[];
}

// ----------------------------------------------------
// Audit Trail Report
// ----------------------------------------------------
export interface AuditTrailRow {
  timestamp: string;
  userId: string;
  actionType: string;
  entityName: string;
  entityId: string;
  oldValuesSummary?: string;
  newValuesSummary?: string;
  ipAddress?: string;
}

export interface AuditTrailReport {
  generatedAt: string;
  filters: ReportFilterParams;
  summary: {
    totalEvents: number;
  };
  rows: AuditTrailRow[];
}

// ----------------------------------------------------
// Executive Dashboards Aggregated Data
// ----------------------------------------------------
export interface MonthlySalesTrend {
  month: string;
  salesAmount: number;
  ordersCount: number;
}

export interface OwnerDashboardData {
  todayOrdersCount: number;
  todaySalesAmount: number;
  totalSalesRevenue: number;
  totalProductionGoodPackets: number;
  availableFinishedGoodsPackets: number;
  rawMaterialValuation: number;
  packagingMaterialValuation: number;
  lowStockAlertsCount: number;
  productionVarianceAlertsCount: number;
  benchmarkCostPerPacket: number;
  totalOutstandingReceivables: number;
  monthlySalesTrends: MonthlySalesTrend[];
  lowStockItems: {
    code: string;
    name: string;
    category: string;
    stock: number;
    reorderLevel: number;
    unit: string;
  }[];
  activeVarianceAlerts: {
    runNumber: string;
    productName: string;
    metric: string;
    variancePct: number;
    description: string;
  }[];
}

export interface AdminDashboardData {
  orders: {
    pendingCount: number;
    approvedCount: number;
    invoicedCount: number;
    cancelledCount: number;
    totalCount: number;
  };
  invoicesGeneratedCount: number;
  totalInvoicedValue: number;
  dispatchStatusCounts: {
    pending: number;
    partiallyDispatched: number;
    dispatched: number;
  };
  customerCollectionsTotal: number;
  stockAvailability: {
    id: string;
    code: string;
    name: string;
    category: string;
    currentStock: number;
    allocatedStock: number;
    availableStock: number;
    unit: string;
    reorderLevel: number;
    status: string;
  }[];
}

export interface ProductionDashboardData {
  totalProductionRuns: number;
  completedRunsCount: number;
  inProgressRunsCount: number;
  plannedVsActual: {
    plannedOutput: number;
    actualGoodOutput: number;
    damagedPackets: number;
    overallYieldPct: number;
  };
  rawMaterialConsumption: {
    materialName: string;
    plannedQty: number;
    actualQty: number;
    unit: string;
    variancePct: number;
  }[];
  productionWastage: {
    totalDamagedPackets: number;
    totalScrapPouches: number;
    totalWastageValue: number;
  };
  yieldVariances: {
    runNumber: string;
    productName: string;
    yieldPercentage: number;
    yieldVariancePercentage: number;
    hasAlert: boolean;
  }[];
  finishedGoodsStock: {
    productName: string;
    availablePackets: number;
    currentStock: number;
    allocatedStock: number;
  }[];
}
