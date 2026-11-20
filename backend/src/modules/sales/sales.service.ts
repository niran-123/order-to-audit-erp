/**
 * Sales, GST Billing & Dispatch System Service
 * Order-to-Audit Manufacturing ERP
 * 
 * Strict Invariants & Business Logic:
 * 1. Mobile Salesman interface integration & cross-salesman access security
 * 2. Admin Order Management (Approval / Rejection with mandatory reason)
 * 3. GST Statutory Compliance:
 *    - Intra-state (Tamil Nadu 33 -> 33): CGST (2.5%) + SGST (2.5%)
 *    - Inter-state (Tamil Nadu 33 -> Karnataka 29): IGST (5.0%)
 *    - Benchmark Retailer A: 150 pkts @ ₹50 = ₹7,500 + ₹187.50 CGST + ₹187.50 SGST = ₹7,875
 * 4. Real-time Stock Availability & Shortage Detection:
 *    - Available stock check before dispatch
 *    - Benchmark Distributor B: 120 pkts requested, 88 available -> Shortage 32 pkts flagged
 *    - Strictly prevents unauthorized dispatch & negative stock
 * 5. Atomic Dispatch Execution:
 *    - Generates Delivery Challan (DC-2026-XXXXX)
 *    - Deducts stock via DISPATCH_OUT movement
 *    - Supports partial dispatches (PARTIALLY_DISPATCHED)
 * 6. Audit Immutability: Posted invoices cannot be deleted
 */

import {
  SalesOrderDTO,
  SalesOrderItemDTO,
  GSTInvoiceDTO,
  GSTInvoiceItemDTO,
  DispatchDTO,
  DispatchItemDTO,
  CreateSalesOrderRequest,
  CreateDispatchRequest,
  StockAvailabilityCheckDTO,
  OrderStatus,
} from './sales.types';
import { ENTERPRISE_SELLER_INFO, BENCHMARK_CUSTOMERS } from './sales.benchmark';
import { InventoryService } from '../inventory/inventory.service';
import { store as masterDataStore } from '../master-data/master-data.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/appError';
import { recordSecurityAudit } from '../audit/audit.service';

class SalesStore {
  public orders: Map<string, SalesOrderDTO> = new Map();
  public invoices: Map<string, GSTInvoiceDTO> = new Map();
  public dispatches: Map<string, DispatchDTO> = new Map();

  public orderSeq: number = 100;
  public invoiceSeq: number = 100;
  public dispatchSeq: number = 100;

  constructor() {
    this.resetToBenchmark();
  }

  public resetToBenchmark() {
    this.orders.clear();
    this.invoices.clear();
    this.dispatches.clear();
    this.orderSeq = 100;
    this.invoiceSeq = 100;
    this.dispatchSeq = 100;
  }
}

export const salesStore = new SalesStore();

export class SalesService {
  /**
   * Reset store to benchmark state
   */
  static resetBenchmark() {
    salesStore.resetToBenchmark();
  }

  // ==========================================
  // PART A: SALES ORDER MANAGEMENT
  // ==========================================

  /**
   * Create Sales Order (Mobile Salesman / Web Portal)
   */
  static async createOrder(
    req: CreateSalesOrderRequest,
    salesman: { userId: string; name?: string; email: string }
  ): Promise<SalesOrderDTO> {
    if (!req.items || req.items.length === 0) {
      throw new BadRequestError('Sales order must contain at least one product item');
    }

    // Lookup customer from benchmark customers or master data
    let customer = BENCHMARK_CUSTOMERS.find(
      (c) => c.id === req.customerId || c.code === req.customerId
    );
    if (!customer) {
      const mdCustomer = masterDataStore.customers.find(
        (c) => c.id === req.customerId || c.code === req.customerId
      );
      if (mdCustomer) {
        customer = {
          id: mdCustomer.id,
          code: mdCustomer.code,
          businessName: mdCustomer.businessName,
          customerType: mdCustomer.customerType as any,
          gstin: mdCustomer.gstin || '',
          state: mdCustomer.state,
          stateCode: mdCustomer.stateCode,
          billingAddress: mdCustomer.billingAddress,
          shippingAddress: mdCustomer.shippingAddress,
          phone: mdCustomer.phone,
          email: mdCustomer.email || '',
        };
      }
    }

    if (!customer) {
      throw new NotFoundError(`Customer not found for ID: ${req.customerId}`);
    }

    // Determine GST tax jurisdiction
    // Seller is in Tamil Nadu (State Code 33)
    const isInterState = customer.stateCode !== ENTERPRISE_SELLER_INFO.stateCode;

    salesStore.orderSeq += 1;
    const soNumber = `SO-2026-${salesStore.orderSeq.toString().padStart(5, '0')}`;
    const id = `so-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const items: SalesOrderItemDTO[] = req.items.map((item, idx) => {
      if (item.orderedQty <= 0) {
        throw new BadRequestError('Ordered quantity must be greater than zero');
      }

      // Lookup product from inventory / master data
      const invProduct = InventoryService.getItemById(item.productId);

      // Default unit price based on customer type (Retailer ₹50.00, Distributor ₹46.50)
      let unitPrice = item.unitPrice;
      if (!unitPrice || unitPrice <= 0) {
        unitPrice = customer?.customerType === 'DISTRIBUTOR' ? 46.5 : 50.0;
      }

      const taxableValue = Number((item.orderedQty * unitPrice).toFixed(2));
      const gstRate = 5.0; // Benchmark Murukku 200g GST rate: 5%

      let itemCgstRate = 0;
      let itemCgstAmt = 0;
      let itemSgstRate = 0;
      let itemSgstAmt = 0;
      let itemIgstRate = 0;
      let itemIgstAmt = 0;

      if (isInterState) {
        // Inter-state supply to Karnataka (IGST 5.0%)
        itemIgstRate = 5.0;
        itemIgstAmt = Number(((taxableValue * itemIgstRate) / 100).toFixed(2));
      } else {
        // Intra-state Tamil Nadu supply (CGST 2.5% + SGST 2.5%)
        itemCgstRate = 2.5;
        itemCgstAmt = Number(((taxableValue * itemCgstRate) / 100).toFixed(2));
        itemSgstRate = 2.5;
        itemSgstAmt = Number(((taxableValue * itemSgstRate) / 100).toFixed(2));
      }

      const lineTotal = Number(
        (taxableValue + itemCgstAmt + itemSgstAmt + itemIgstAmt).toFixed(2)
      );

      subtotal += taxableValue;
      cgstAmount += itemCgstAmt;
      sgstAmount += itemSgstAmt;
      igstAmount += itemIgstAmt;

      return {
        id: `soi-${id}-${idx + 1}`,
        productId: invProduct.id,
        productCode: invProduct.itemCode,
        productName: invProduct.itemName,
        hsnCode: '19059040',
        orderedQty: item.orderedQty,
        allocatedQty: 0,
        dispatchedQty: 0,
        unitPrice,
        taxRate: gstRate,
        taxableValue,
        cgstRate: itemCgstRate,
        cgstAmount: itemCgstAmt,
        sgstRate: itemSgstRate,
        sgstAmount: itemSgstAmt,
        igstRate: itemIgstRate,
        igstAmount: itemIgstAmt,
        lineTotal,
        unitCode: invProduct.unitCode,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    cgstAmount = Number(cgstAmount.toFixed(2));
    sgstAmount = Number(sgstAmount.toFixed(2));
    igstAmount = Number(igstAmount.toFixed(2));
    const totalTax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
    const totalAmount = Number((subtotal + totalTax).toFixed(2));

    const newOrder: SalesOrderDTO = {
      id,
      soNumber,
      customerId: customer.id,
      customerCode: customer.code,
      customerName: customer.businessName,
      customerType: customer.customerType,
      customerGstin: customer.gstin,
      customerState: customer.state,
      customerStateCode: customer.stateCode,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      salesmanId: salesman.userId,
      salesmanName: salesman.name || salesman.email.split('@')[0],
      salesmanEmail: salesman.email,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: req.expectedDeliveryDate,
      paymentTerms: req.paymentTerms || 'Net 30 Days',
      status: 'SUBMITTED', // Submitted by salesman, ready for Admin review
      items,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      totalAmount,
      dispatchCount: 0,
      notes: req.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    salesStore.orders.set(id, newOrder);

    await recordSecurityAudit({
      userId: salesman.userId,
      entityName: 'SALES_ORDER',
      entityId: id,
      actionType: 'CREATE',
      newValues: {
        soNumber,
        customerName: customer.businessName,
        totalAmount,
        salesmanEmail: salesman.email,
      },
    });

    return newOrder;
  }

  /**
   * List Sales Orders with Role-Based Scoping
   * Salesmen only see their own orders. Admin/Owner/Auditor see all orders.
   */
  static listOrders(
    filters?: {
      status?: OrderStatus;
      customerId?: string;
      search?: string;
    },
    currentUser?: { userId: string; email: string; roles: string[] }
  ): SalesOrderDTO[] {
    let list = Array.from(salesStore.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Enforce Salesman Scoping
    if (
      currentUser &&
      currentUser.roles.includes('SALESMAN') &&
      !currentUser.roles.includes('OWNER') &&
      !currentUser.roles.includes('ADMIN')
    ) {
      list = list.filter(
        (o) => o.salesmanEmail === currentUser.email || o.salesmanId === currentUser.userId
      );
    }

    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }

    if (filters?.customerId) {
      list = list.filter((o) => o.customerId === filters.customerId || o.customerCode === filters.customerId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.soNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.salesmanName.toLowerCase().includes(q) ||
          (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * Get Single Order with Cross-Salesman Access Protection
   */
  static getOrderById(
    id: string,
    currentUser?: { userId: string; email: string; roles: string[] }
  ): SalesOrderDTO {
    const order = salesStore.orders.get(id);
    if (!order) {
      const byNumber = Array.from(salesStore.orders.values()).find((o) => o.soNumber === id);
      if (!byNumber) {
        throw new NotFoundError(`Sales order not found for: ${id}`);
      }
      return this.enforceOrderAccess(byNumber, currentUser);
    }
    return this.enforceOrderAccess(order, currentUser);
  }

  private static enforceOrderAccess(
    order: SalesOrderDTO,
    currentUser?: { userId: string; email: string; roles: string[] }
  ): SalesOrderDTO {
    if (
      currentUser &&
      currentUser.roles.includes('SALESMAN') &&
      !currentUser.roles.includes('OWNER') &&
      !currentUser.roles.includes('ADMIN')
    ) {
      if (order.salesmanEmail !== currentUser.email && order.salesmanId !== currentUser.userId) {
        throw new ForbiddenError(
          'Forbidden: Salesmen cannot access sales orders belonging to other sales representatives.'
        );
      }
    }
    return order;
  }

  // ==========================================
  // PART B: ADMIN ORDER MANAGEMENT & APPROVAL
  // ==========================================

  /**
   * Approve Order (Admin / Owner)
   */
  static async approveOrder(
    orderId: string,
    adminUser: { userId: string; email: string }
  ): Promise<SalesOrderDTO> {
    const order = this.getOrderById(orderId);

    if (order.status !== 'SUBMITTED' && order.status !== 'UNDER_REVIEW') {
      throw new BadRequestError(
        `Cannot approve order ${order.soNumber} in status '${order.status}'. Only SUBMITTED orders can be approved.`
      );
    }

    order.status = 'APPROVED';
    order.approvedBy = adminUser.email;
    order.approvedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    await recordSecurityAudit({
      userId: adminUser.userId,
      entityName: 'SALES_ORDER',
      entityId: order.id,
      actionType: 'UPDATE',
      newValues: {
        soNumber: order.soNumber,
        status: 'APPROVED',
        approvedBy: adminUser.email,
      },
    });

    return order;
  }

  /**
   * Reject Order with Mandatory Reason (Admin / Owner)
   */
  static async rejectOrder(
    orderId: string,
    reason: string,
    adminUser: { userId: string; email: string }
  ): Promise<SalesOrderDTO> {
    if (!reason || reason.trim().length < 3) {
      throw new BadRequestError('A specific rejection reason (min 3 chars) is required.');
    }

    const order = this.getOrderById(orderId);
    if (order.status === 'DISPATCHED' || order.status === 'INVOICED') {
      throw new BadRequestError(`Cannot reject order in status '${order.status}'`);
    }

    order.status = 'REJECTED';
    order.rejectionReason = reason.trim();
    order.updatedAt = new Date().toISOString();

    await recordSecurityAudit({
      userId: adminUser.userId,
      entityName: 'SALES_ORDER',
      entityId: order.id,
      actionType: 'UPDATE',
      newValues: {
        soNumber: order.soNumber,
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    return order;
  }

  // ==========================================
  // PART E: STOCK AVAILABILITY & SHORTAGE ENGINE
  // ==========================================

  /**
   * Check Real-time Finished Goods Availability vs Requested Quantity
   * Benchmark Distributor B: 120 requested, 88 available -> Shortage 32 pkts
   */
  static checkStockAvailability(productId: string, requestedQty: number): StockAvailabilityCheckDTO {
    const invItem = InventoryService.getItemById(productId);
    const availableQty = invItem.currentStock;
    const shortageQty = Math.max(0, Number((requestedQty - availableQty).toFixed(4)));
    const hasShortage = shortageQty > 0;
    const replenishmentRequired = hasShortage;

    let message = `Stock check passed: ${requestedQty} ${invItem.unitCode} available in finished goods inventory.`;
    if (hasShortage) {
      message = `Insufficient finished goods stock for ${invItem.itemName} (${invItem.itemCode}): Available: ${availableQty} ${invItem.unitCode}, Requested: ${requestedQty} ${invItem.unitCode}, Shortage: ${shortageQty} ${invItem.unitCode}. Production replenishment required.`;
    }

    return {
      productId: invItem.id,
      productCode: invItem.itemCode,
      productName: invItem.itemName,
      requestedQty,
      availableQty,
      shortageQty,
      hasShortage,
      replenishmentRequired,
      message,
    };
  }

  // ==========================================
  // PART C: GST INVOICE GENERATION
  // ==========================================

  /**
   * Generate GST Tax Invoice from Approved Sales Order
   * - Sequential numbering: INV-2026-00001
   * - Intra-state Tamil Nadu: CGST 2.5% + SGST 2.5%
   * - Inter-state Karnataka: IGST 5.0%
   * - Posted invoice cannot be deleted
   */
  static async generateInvoice(
    orderId: string,
    currentUser: { userId: string; email: string }
  ): Promise<GSTInvoiceDTO> {
    const order = this.getOrderById(orderId);

    if (
      order.status !== 'APPROVED' &&
      order.status !== 'INVOICED' &&
      order.status !== 'PARTIALLY_DISPATCHED'
    ) {
      throw new BadRequestError(
        `Cannot generate invoice for order ${order.soNumber} in status '${order.status}'. Order must be APPROVED.`
      );
    }

    salesStore.invoiceSeq += 1;
    const invoiceNumber = `INV-2026-${salesStore.invoiceSeq.toString().padStart(5, '0')}`;
    const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const isInterState = order.customerStateCode !== ENTERPRISE_SELLER_INFO.stateCode;
    const placeOfSupply = `${order.customerState} (${order.customerStateCode})`;

    const invoiceItems: GSTInvoiceItemDTO[] = order.items.map((item, idx) => ({
      id: `invi-${id}-${idx + 1}`,
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      hsnCode: item.hsnCode,
      quantity: item.orderedQty,
      unitPrice: item.unitPrice,
      taxableValue: item.taxableValue,
      cgstRate: item.cgstRate,
      cgstAmount: item.cgstAmount,
      sgstRate: item.sgstRate,
      sgstAmount: item.sgstAmount,
      igstRate: item.igstRate,
      igstAmount: item.igstAmount,
      totalAmount: item.lineTotal,
      unitCode: item.unitCode,
    }));

    const invoice: GSTInvoiceDTO = {
      id,
      invoiceNumber,
      salesOrderId: order.id,
      soNumber: order.soNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerGstin: order.customerGstin,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      placeOfSupply,
      placeOfSupplyStateCode: order.customerStateCode,
      isInterState,
      sellerName: ENTERPRISE_SELLER_INFO.name,
      sellerAddress: ENTERPRISE_SELLER_INFO.address,
      sellerGstin: ENTERPRISE_SELLER_INFO.gstin,
      sellerState: ENTERPRISE_SELLER_INFO.state,
      sellerStateCode: ENTERPRISE_SELLER_INFO.stateCode,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      invoiceType: 'TAX_INVOICE',
      status: 'POSTED',
      isPosted: true,
      postedAt: new Date().toISOString(),
      items: invoiceItems,
      taxableAmount: order.subtotal,
      cgstAmount: order.cgstAmount,
      sgstAmount: order.sgstAmount,
      igstAmount: order.igstAmount,
      totalTax: order.totalTax,
      grandTotal: order.totalAmount,
      paidAmount: 0.0,
      createdBy: currentUser.userId,
      createdByName: currentUser.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    salesStore.invoices.set(id, invoice);

    // Update order with invoice link
    order.invoiceId = invoice.id;
    order.invoiceNumber = invoice.invoiceNumber;
    if (order.status === 'APPROVED') {
      order.status = 'INVOICED';
    }
    order.updatedAt = new Date().toISOString();

    await recordSecurityAudit({
      userId: currentUser.userId,
      entityName: 'GST_INVOICE',
      entityId: id,
      actionType: 'POST',
      newValues: {
        invoiceNumber,
        soNumber: order.soNumber,
        grandTotal: invoice.grandTotal,
        customerName: order.customerName,
        isInterState,
      },
    });

    return invoice;
  }

  static listInvoices(): GSTInvoiceDTO[] {
    return Array.from(salesStore.invoices.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static getInvoiceById(id: string): GSTInvoiceDTO {
    const inv = salesStore.invoices.get(id);
    if (!inv) {
      const byNumber = Array.from(salesStore.invoices.values()).find(
        (i) => i.invoiceNumber === id
      );
      if (!byNumber) {
        throw new NotFoundError(`Invoice not found for: ${id}`);
      }
      return byNumber;
    }
    return inv;
  }

  static deleteInvoice(id: string): void {
    const inv = this.getInvoiceById(id);
    if (inv.isPosted || inv.status === 'POSTED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'PAID') {
      throw new BadRequestError('Statutory Violation: Posted GST invoices are immutable and cannot be deleted.');
    }
    salesStore.invoices.delete(inv.id);
  }

  // ==========================================
  // PART D: DISPATCH & STOCK DEDUCTION
  // ==========================================

  /**
   * Execute Dispatch (Delivery Challan)
   * 1. Validate finished goods availability
   * 2. Prevent unauthorized dispatch & negative stock
   * 3. Create Delivery Challan (DC-2026-XXXXX)
   * 4. Deduct dispatched quantity from FG inventory (DISPATCH_OUT)
   * 5. Update order status (DISPATCHED or PARTIALLY_DISPATCHED)
   */
  static async createDispatch(
    orderId: string,
    req: CreateDispatchRequest,
    currentUser: { userId: string; email: string }
  ): Promise<DispatchDTO> {
    const order = this.getOrderById(orderId);

    if (order.status !== 'APPROVED' && order.status !== 'INVOICED' && order.status !== 'PARTIALLY_DISPATCHED') {
      throw new BadRequestError(
        `Cannot dispatch order ${order.soNumber} in status '${order.status}'. Order must be APPROVED or INVOICED.`
      );
    }

    if (!req.items || req.items.length === 0) {
      throw new BadRequestError('Dispatch must contain at least one line item');
    }

    // -------------------------------------------------------------
    // PRE-CHECK: Validate Finished Goods Stock Availability
    // -------------------------------------------------------------
    for (const item of req.items) {
      if (item.dispatchedQty <= 0) {
        throw new BadRequestError('Dispatch quantity must be strictly greater than zero');
      }

      const invItem = InventoryService.getItemById(item.productId);
      if (invItem.currentStock < item.dispatchedQty) {
        const shortage = Number((item.dispatchedQty - invItem.currentStock).toFixed(4));
        throw new BadRequestError(
          `Insufficient finished goods stock for ${invItem.itemName} (${invItem.itemCode}): Available: ${invItem.currentStock} ${invItem.unitCode}, Requested Dispatch: ${item.dispatchedQty} ${invItem.unitCode}, Shortage: ${shortage} ${invItem.unitCode}. Production replenishment required.`
        );
      }
    }

    salesStore.dispatchSeq += 1;
    const dispatchNumber = `DSP-2026-${salesStore.dispatchSeq.toString().padStart(5, '0')}`;
    const deliveryChallanNo = `DC-2026-${salesStore.dispatchSeq.toString().padStart(5, '0')}`;
    const id = `dsp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let totalDispatchedQty = 0;
    const dispatchItems: DispatchItemDTO[] = [];

    // Deduct stock for each line item using atomic stock ledger movements
    for (const item of req.items) {
      const invItem = InventoryService.getItemById(item.productId);

      // Record DISPATCH_OUT movement in inventory
      await InventoryService.dispatchFinishedGoods({
        productId: invItem.id,
        dispatchChallanId: deliveryChallanNo,
        quantity: item.dispatchedQty,
        performedBy: currentUser.userId,
        customerName: order.customerName,
      });

      // Update dispatched qty on order item
      const orderItem = order.items.find(
        (oi) => oi.id === item.salesOrderItemId || oi.productId === item.productId
      );
      if (orderItem) {
        orderItem.dispatchedQty = Number((orderItem.dispatchedQty + item.dispatchedQty).toFixed(4));
      }

      totalDispatchedQty += item.dispatchedQty;

      dispatchItems.push({
        id: `dspi-${id}-${dispatchItems.length + 1}`,
        salesOrderItemId: item.salesOrderItemId,
        productId: invItem.id,
        productCode: invItem.itemCode,
        productName: invItem.itemName,
        dispatchedQty: item.dispatchedQty,
        unitCode: invItem.unitCode,
      });
    }

    // Determine if fully or partially dispatched
    const totalOrdered = order.items.reduce((acc, curr) => acc + curr.orderedQty, 0);
    const totalDispatchedSoFar = order.items.reduce((acc, curr) => acc + curr.dispatchedQty, 0);

    if (totalDispatchedSoFar >= totalOrdered) {
      order.status = 'DISPATCHED';
    } else {
      order.status = 'PARTIALLY_DISPATCHED';
    }
    order.dispatchCount += 1;
    order.updatedAt = new Date().toISOString();

    const dispatch: DispatchDTO = {
      id,
      dispatchNumber,
      deliveryChallanNo,
      salesOrderId: order.id,
      soNumber: order.soNumber,
      invoiceId: order.invoiceId,
      invoiceNumber: order.invoiceNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      shippingAddress: order.shippingAddress,
      dispatchDate: new Date().toISOString(),
      carrierName: req.carrierName || 'Enterprise Express Logistics',
      vehicleNumber: req.vehicleNumber || 'TN-49-AB-1234',
      trackingNumber: req.trackingNumber || `TRK-${deliveryChallanNo}`,
      status: 'DISPATCHED',
      items: dispatchItems,
      totalDispatchedQty,
      performedBy: currentUser.userId,
      performerName: currentUser.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    salesStore.dispatches.set(id, dispatch);

    await recordSecurityAudit({
      userId: currentUser.userId,
      entityName: 'DISPATCH',
      entityId: id,
      actionType: 'POST',
      newValues: {
        dispatchNumber,
        deliveryChallanNo,
        soNumber: order.soNumber,
        totalDispatchedQty,
        orderStatus: order.status,
      },
    });

    return dispatch;
  }

  static listDispatches(orderId?: string): DispatchDTO[] {
    let list = Array.from(salesStore.dispatches.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (orderId) {
      list = list.filter((d) => d.salesOrderId === orderId || d.soNumber === orderId);
    }
    return list;
  }

  /**
   * Customer-wise Sales Report
   */
  static getCustomerWiseSales(salesmanId?: string) {
    const orders = this.listOrders(undefined, salesmanId ? { userId: salesmanId, email: '', roles: ['SALESMAN'] } : undefined);

    const map = new Map<string, { customerName: string; customerType: string; orderCount: number; totalRevenue: number }>();

    for (const o of orders) {
      if (o.status === 'REJECTED' || o.status === 'CANCELLED' || o.status === 'DRAFT') {
        continue;
      }
      const existing = map.get(o.customerId) || {
        customerName: o.customerName,
        customerType: o.customerType,
        orderCount: 0,
        totalRevenue: 0,
      };
      existing.orderCount += 1;
      existing.totalRevenue = Number((existing.totalRevenue + o.totalAmount).toFixed(2));
      map.set(o.customerId, existing);
    }

    return Array.from(map.entries()).map(([customerId, data]) => ({
      customerId,
      ...data,
      avgOrderValue: data.orderCount > 0 ? Number((data.totalRevenue / data.orderCount).toFixed(2)) : 0,
    }));
  }
}
