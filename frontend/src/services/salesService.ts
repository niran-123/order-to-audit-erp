import api from './api';

export interface SalesOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  hsnCode: string;
  orderedQty: number;
  allocatedQty: number;
  dispatchedQty: number;
  unitPrice: number;
  taxRate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  lineTotal: number;
  unitCode: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  customerGstin?: string;
  customerState: string;
  customerStateCode: string;
  shippingAddress: string;
  billingAddress: string;
  salesmanId: string;
  salesmanName: string;
  salesmanEmail: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'INVOICED'
    | 'PARTIALLY_DISPATCHED'
    | 'DISPATCHED'
    | 'CANCELLED';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  items: SalesOrderItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  invoiceId?: string;
  invoiceNumber?: string;
  dispatchCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GSTInvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
  unitCode: string;
}

export interface GSTInvoice {
  id: string;
  invoiceNumber: string;
  salesOrderId: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  placeOfSupplyStateCode: string;
  isInterState: boolean;
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerState: string;
  sellerStateCode: string;
  invoiceDate: string;
  dueDate: string;
  invoiceType: string;
  status: string;
  isPosted: boolean;
  postedAt?: string;
  items: GSTInvoiceItem[];
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchItem {
  id: string;
  salesOrderItemId?: string;
  productId: string;
  productCode: string;
  productName: string;
  dispatchedQty: number;
  unitCode: string;
}

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  deliveryChallanNo: string;
  salesOrderId: string;
  soNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  dispatchDate: string;
  carrierName: string;
  vehicleNumber: string;
  trackingNumber: string;
  status: string;
  items: DispatchItem[];
  totalDispatchedQty: number;
  performedBy: string;
  performerName?: string;
  notes?: string;
  createdAt: string;
}

export interface StockAvailabilityCheck {
  productId: string;
  productCode: string;
  productName: string;
  requestedQty: number;
  availableQty: number;
  shortageQty: number;
  hasShortage: boolean;
  replenishmentRequired: boolean;
  message: string;
}

export interface CustomerSalesSummary {
  customerId: string;
  customerName: string;
  customerType: string;
  orderCount: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export const salesService = {
  // Orders
  async getOrders(params?: { status?: string; customerId?: string; search?: string }): Promise<SalesOrder[]> {
    const res = await api.get('/sales/orders', { params });
    return res.data.data;
  },

  async getOrderById(id: string): Promise<SalesOrder> {
    const res = await api.get(`/sales/orders/${id}`);
    return res.data.data;
  },

  async createOrder(data: {
    customerId: string;
    expectedDeliveryDate?: string;
    paymentTerms?: string;
    notes?: string;
    items: Array<{ productId: string; orderedQty: number; unitPrice?: number }>;
  }): Promise<SalesOrder> {
    const res = await api.post('/sales/orders', data);
    return res.data.data;
  },

  async approveOrder(id: string, notes?: string): Promise<SalesOrder> {
    const res = await api.post(`/sales/orders/${id}/approve`, { notes });
    return res.data.data;
  },

  async rejectOrder(id: string, reason: string): Promise<SalesOrder> {
    const res = await api.post(`/sales/orders/${id}/reject`, { reason });
    return res.data.data;
  },

  // Stock check
  async checkStockAvailability(productId: string, requestedQty: number): Promise<StockAvailabilityCheck> {
    const res = await api.get(`/sales/check-stock/${productId}`, {
      params: { requestedQty },
    });
    return res.data.data;
  },

  // Invoices
  async generateInvoice(orderId: string): Promise<GSTInvoice> {
    const res = await api.post(`/sales/orders/${orderId}/invoice`);
    return res.data.data;
  },

  async getInvoices(): Promise<GSTInvoice[]> {
    const res = await api.get('/invoices');
    return res.data.data;
  },

  async getInvoiceById(id: string): Promise<GSTInvoice> {
    const res = await api.get(`/invoices/${id}`);
    return res.data.data;
  },

  // Dispatches
  async createDispatch(
    orderId: string,
    data: {
      carrierName?: string;
      vehicleNumber?: string;
      trackingNumber?: string;
      notes?: string;
      items: Array<{ salesOrderItemId?: string; productId: string; dispatchedQty: number }>;
    }
  ): Promise<Dispatch> {
    const res = await api.post(`/sales/orders/${orderId}/dispatch`, data);
    return res.data.data;
  },

  async getDispatches(orderId?: string): Promise<Dispatch[]> {
    const res = await api.get('/sales/dispatches', { params: { orderId } });
    return res.data.data;
  },

  // Analytics
  async getCustomerSales(): Promise<CustomerSalesSummary[]> {
    const res = await api.get('/sales/customer-sales');
    return res.data.data;
  },
};
