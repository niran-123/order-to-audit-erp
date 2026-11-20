/**
 * Sales, Invoicing & Dispatch System Types
 * Order-to-Audit Manufacturing ERP
 */

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'INVOICED'
  | 'PARTIALLY_DISPATCHED'
  | 'DISPATCHED'
  | 'CANCELLED';

export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type InvoiceType = 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'CREDIT_NOTE';
export type DispatchStatus = 'PENDING' | 'DISPATCHED' | 'DELIVERED';

export interface SalesOrderItemDTO {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  hsnCode: string;
  orderedQty: number;
  allocatedQty: number;
  dispatchedQty: number;
  unitPrice: number;
  taxRate: number; // e.g. 5.0%
  taxableValue: number; // orderedQty * unitPrice
  cgstRate: number; // e.g. 2.5% for intra-state
  cgstAmount: number;
  sgstRate: number; // e.g. 2.5% for intra-state
  sgstAmount: number;
  igstRate: number; // e.g. 5.0% for inter-state
  igstAmount: number;
  lineTotal: number;
  unitCode: string;
}

export interface SalesOrderDTO {
  id: string;
  soNumber: string; // SO-2026-00001
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  customerGstin?: string;
  customerState: string; // Tamil Nadu (33), Karnataka (29)
  customerStateCode: string;
  shippingAddress: string;
  billingAddress: string;
  salesmanId: string;
  salesmanName: string;
  salesmanEmail: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  status: OrderStatus;
  items: SalesOrderItemDTO[];
  subtotal: number; // Taxable value
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  dispatchCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GSTInvoiceItemDTO {
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

export interface GSTInvoiceDTO {
  id: string;
  invoiceNumber: string; // INV-2026-00001
  salesOrderId: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string; // e.g. "Tamil Nadu (33)" or "Karnataka (29)"
  placeOfSupplyStateCode: string;
  isInterState: boolean;

  // Seller Information (Enterprise)
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerState: string;
  sellerStateCode: string;

  invoiceDate: string;
  dueDate: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  isPosted: boolean;
  postedAt?: string;

  items: GSTInvoiceItemDTO[];
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;

  irn?: string;
  qrCode?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchItemDTO {
  id: string;
  salesOrderItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  dispatchedQty: number;
  unitCode: string;
}

export interface DispatchDTO {
  id: string;
  dispatchNumber: string; // DSP-2026-00001
  deliveryChallanNo: string; // DC-2026-00001
  salesOrderId: string;
  soNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  shippingAddress: string;
  dispatchDate: string;
  carrierName?: string;
  vehicleNumber?: string;
  trackingNumber?: string;
  status: DispatchStatus;
  items: DispatchItemDTO[];
  totalDispatchedQty: number;
  performedBy: string;
  performerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAvailabilityCheckDTO {
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

export interface CreateSalesOrderRequest {
  customerId: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  notes?: string;
  items: {
    productId: string;
    orderedQty: number;
    unitPrice?: number; // optional, defaults to price tier
  }[];
}

export interface CreateDispatchRequest {
  invoiceId?: string;
  carrierName?: string;
  vehicleNumber?: string;
  trackingNumber?: string;
  items: {
    salesOrderItemId: string;
    productId: string;
    dispatchedQty: number;
  }[];
}
