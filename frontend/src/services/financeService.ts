import api from './api';

export type PaymentMethod = 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'CHEQUE' | 'UPI' | 'CASH';
export type PaymentStatus = 'RECEIVED' | 'BOUNCED' | 'CANCELLED';

export interface PaymentAllocation {
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

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  bankName?: string;
  status: PaymentStatus;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocations: PaymentAllocation[];
  notes?: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

export interface RecordPaymentRequest {
  customerId: string;
  invoiceId?: string;
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

export interface CustomerReceivable {
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

export interface InvoiceReceivable {
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

export interface ReceivablesSummary {
  totalReceivables: number;
  totalInvoiced: number;
  totalCollected: number;
  paidInvoicesCount: number;
  partiallyPaidCount: number;
  unpaidInvoicesCount: number;
  customerBreakdown: CustomerReceivable[];
  invoices: InvoiceReceivable[];
  ageingAnalysis: {
    bucket0_30: { count: number; amount: number };
    bucket31_60: { count: number; amount: number };
    bucket61_90: { count: number; amount: number };
    bucketAbove90: { count: number; amount: number };
  };
}

export interface DirectMaterialCostLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
  unitCode: string;
  actualQty: number;
  valuationRate: number;
  totalCost: number;
}

export interface ProductionCosting {
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
  directMaterialLines: DirectMaterialCostLine[];
  totalDirectMaterialCost: number;
  overheads: {
    labourCost: number;
    gasPowerCost: number;
    otherOverheads: number;
    totalOverheadCost: number;
    allocationMethodology: string;
  };
  totalProductionCost: number;
  costPerGoodPacket: number;
  costPerPlannedPacket: number;
  scrapLossImpact: number;
}

export interface ProductProfitability {
  productId: string;
  productCode: string;
  productName: string;
  unitCode: string;
  packSize: string;
  costPerGoodPacket: number;
  pricingTiers: Array<{
    tierName: string;
    sellingPrice: number;
    grossProfitPerPacket: number;
    grossMarginPct: number;
  }>;
  productionRunReference: {
    runNumber: string;
    actualOutput: number;
    totalBatchCost: number;
  };
}

export const financeService = {
  async recordPayment(data: RecordPaymentRequest): Promise<Payment> {
    const res = await api.post('/payments', data);
    return res.data.data;
  },

  async getPayments(params?: { customerId?: string; search?: string }): Promise<Payment[]> {
    const res = await api.get('/payments', { params });
    return res.data.data;
  },

  async getPaymentById(id: string): Promise<Payment> {
    const res = await api.get(`/payments/${id}`);
    return res.data.data;
  },

  async getAccountsReceivable(): Promise<ReceivablesSummary> {
    const res = await api.get('/payments/receivables');
    return res.data.data;
  },

  async getProductionCosting(runId?: string): Promise<ProductionCosting> {
    const res = await api.get('/payments/costing', { params: { runId } });
    return res.data.data;
  },

  async getProductProfitability(): Promise<ProductProfitability> {
    const res = await api.get('/payments/profitability');
    return res.data.data;
  },
};
