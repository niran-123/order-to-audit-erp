/**
 * Finance, Payment Management & Production Costing Types
 * Order-to-Audit Manufacturing ERP
 */

export type PaymentMethod = 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'CHEQUE' | 'UPI' | 'CASH';
export type PaymentStatus = 'RECEIVED' | 'BOUNCED' | 'CANCELLED';

export interface PaymentAllocationDTO {
  id: string;
  paymentId: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  soNumber?: string;
  allocatedAmount: number;
  allocatedAt: string;
  recordedBy: string;
}

export interface PaymentDTO {
  id: string;
  paymentNumber: string; // PAY-2026-00001
  customerId: string;
  customerCode: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // UTR / Cheque / Txn Ref
  bankName?: string;
  status: PaymentStatus;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocations: PaymentAllocationDTO[];
  notes?: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordPaymentRequest {
  customerId: string;
  invoiceId?: string; // Optional direct allocation to specific invoice
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  referenceNumber: string;
  bankName?: string;
  allocations?: Array<{
    invoiceId: string;
    amount: number;
  }>;
  notes?: string;
}

export interface CustomerReceivableDTO {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  invoiceCount: number;
  oldestInvoiceDate?: string;
  status: 'CLEAR' | 'OVERDUE' | 'PARTIAL';
}

export interface InvoiceReceivableDTO {
  id: string;
  invoiceNumber: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  daysOutstanding: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'POSTED' | 'PARTIALLY_PAID' | 'PAID';
  ageingBucket: '0-30' | '31-60' | '61-90' | '>90';
}

export interface ReceivablesSummaryDTO {
  totalReceivables: number;
  totalInvoiced: number;
  totalCollected: number;
  paidInvoicesCount: number;
  partiallyPaidCount: number;
  unpaidInvoicesCount: number;
  customerBreakdown: CustomerReceivableDTO[];
  invoices: InvoiceReceivableDTO[];
  ageingAnalysis: {
    bucket0_30: { count: number; amount: number };
    bucket31_60: { count: number; amount: number };
    bucket61_90: { count: number; amount: number };
    bucketAbove90: { count: number; amount: number };
  };
}

export interface DirectMaterialCostLineDTO {
  materialId: string;
  materialCode: string;
  materialName: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  unitCode: string;
  actualQty: number;
  valuationRate: number; // Prevailing Weighted-Average Cost from Inventory
  totalCost: number; // actualQty * valuationRate
}

export interface ProductionCostingDTO {
  runId: string;
  runNumber: string;
  batchNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  productionDate: string;
  plannedOutput: number;
  actualGoodOutput: number;
  damagedOutput: number;
  damagedPackagingQty: number;
  directMaterialLines: DirectMaterialCostLineDTO[];
  totalDirectMaterialCost: number;
  overheads: {
    labourCost: number;
    gasPowerCost: number;
    otherOverheads: number;
    totalOverheadCost: number;
    allocationMethodology: string;
  };
  totalProductionCost: number; // totalDirectMaterialCost + totalOverheadCost
  costPerGoodPacket: number; // totalProductionCost / actualGoodOutput
  costPerPlannedPacket: number; // totalProductionCost / plannedOutput (for comparative analysis)
  scrapLossImpact: number; // costPerGoodPacket - costPerPlannedPacket
}

export interface ProductProfitabilityDTO {
  productId: string;
  productCode: string;
  productName: string;
  unitCode: string;
  packSize: string;
  costPerGoodPacket: number;
  pricingTiers: Array<{
    tierName: string; // 'Retailer', 'Distributor'
    sellingPrice: number;
    grossProfitPerPacket: number; // sellingPrice - costPerGoodPacket
    grossMarginPct: number; // (grossProfit / sellingPrice) * 100
  }>;
  productionRunReference: {
    runNumber: string;
    actualOutput: number;
    totalBatchCost: number;
  };
}
