/**
 * Purchase & Procurement Management Service
 * Order-to-Audit Manufacturing ERP
 * 
 * Manages Purchase Orders, Supplier Invoices, GRN Confirmation,
 * and automated Inventory Inflow integration.
 */

import { PurchaseOrderDTO, PurchaseItemDTO, PurchaseStatus } from './inventory.types';
import { InventoryService } from './inventory.service';
import { store as masterDataStore } from '../master-data/master-data.service';
import { BadRequestError, NotFoundError } from '../../utils/appError';
import { recordSecurityAudit } from '../audit/audit.service';

export interface CreatePurchaseRequest {
  supplierId: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  supplierInvoiceNumber?: string;
  items: {
    itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
    materialId: string; // e.g. RM-RICE-01 or inv-rm-rice-01
    orderedQty: number;
    unitCode?: string;
    unitPrice: number;
    taxRate?: number; // e.g. 5, 12, 18 %
  }[];
  createdBy: string;
  createdByName?: string;
}

class PurchasesStore {
  public purchases: Map<string, PurchaseOrderDTO> = new Map();
  public poSequence: number = 100;
  public grnSequence: number = 100;

  constructor() {
    this.resetToBenchmark();
  }

  public resetToBenchmark() {
    this.purchases.clear();
    this.poSequence = 100;
    this.grnSequence = 100;

    // Seed initial benchmark purchase history
    const initialPO: PurchaseOrderDTO = {
      id: 'po-hist-001',
      poNumber: 'PO-2026-00095',
      supplierId: 'sup-tirupati-03',
      supplierName: 'Tirupati Edible Oils & Refinery Corp',
      supplierInvoiceNumber: 'TIR/2026/9941',
      orderDate: '2026-11-15T09:30:00.000Z',
      expectedDeliveryDate: '2026-11-18T18:00:00.000Z',
      status: 'RECEIVED',
      items: [
        {
          id: 'poi-hist-001',
          itemType: 'RAW_MATERIAL',
          materialId: 'inv-rm-oil-01',
          materialCode: 'RM-OIL-01',
          materialName: 'Refined Sunflower Cooking Oil',
          orderedQty: 200.0,
          unitCode: 'LTR',
          unitPrice: 125.0,
          taxRate: 5.0,
          lineTotal: 26250.0, // 200 * 125 = 25000 + 5% GST = 26250
        },
      ],
      subtotal: 25000.0,
      taxAmount: 1250.0,
      totalAmount: 26250.0,
      grnNumber: 'GRN-2026-00095',
      receivedAt: '2026-11-18T14:15:00.000Z',
      createdBy: 'usr-admin-01',
      createdByName: 'K. Rajagopal (Admin)',
      createdAt: '2026-11-15T09:30:00.000Z',
      updatedAt: '2026-11-18T14:15:00.000Z',
    };

    this.purchases.set(initialPO.id, initialPO);
  }
}

export const purchasesStore = new PurchasesStore();

export class PurchasesService {
  /**
   * Reset store to benchmark data
   */
  static resetBenchmark() {
    purchasesStore.resetToBenchmark();
  }

  /**
   * 1. LIST PURCHASES
   */
  static listPurchases(filters?: {
    status?: PurchaseStatus;
    supplierId?: string;
    search?: string;
  }): PurchaseOrderDTO[] {
    let list = Array.from(purchasesStore.purchases.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }

    if (filters?.supplierId) {
      list = list.filter((p) => p.supplierId === filters.supplierId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.poNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          (p.supplierInvoiceNumber && p.supplierInvoiceNumber.toLowerCase().includes(q)) ||
          (p.grnNumber && p.grnNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * 2. GET PURCHASE BY ID OR PO NUMBER
   */
  static getPurchaseById(id: string): PurchaseOrderDTO {
    const po = purchasesStore.purchases.get(id);
    if (!po) {
      const byNumber = Array.from(purchasesStore.purchases.values()).find(
        (p) => p.poNumber === id
      );
      if (!byNumber) {
        throw new NotFoundError(`Purchase order not found for: ${id}`);
      }
      return byNumber;
    }
    return po;
  }

  /**
   * 3. CREATE PURCHASE ORDER
   */
  static async createPurchase(req: CreatePurchaseRequest): Promise<PurchaseOrderDTO> {
    if (!req.items || req.items.length === 0) {
      throw new BadRequestError('Purchase order must contain at least one line item');
    }

    // Resolve supplier name from master data
    let supplierName = 'Benchmark Supplier';
    const supplier = masterDataStore.suppliers.find(
      (s) => s.id === req.supplierId || s.code === req.supplierId
    );
    if (supplier) {
      supplierName = supplier.name;
    }

    purchasesStore.poSequence += 1;
    const poNumber = `PO-2026-${purchasesStore.poSequence.toString().padStart(5, '0')}`;
    const id = `po-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    let taxAmount = 0;

    const lineItems: PurchaseItemDTO[] = req.items.map((item, idx) => {
      if (item.orderedQty <= 0) {
        throw new BadRequestError(`Ordered quantity for item ${idx + 1} must be positive`);
      }
      if (item.unitPrice <= 0) {
        throw new BadRequestError(`Unit purchase rate for item ${idx + 1} must be positive`);
      }

      // Lookup item details in inventory
      let resolvedItem;
      try {
        resolvedItem = InventoryService.getItemById(item.materialId);
      } catch {
        // Fallback or master data lookup
        resolvedItem = {
          id: item.materialId,
          itemCode: item.materialId,
          itemName: `Procured Material (${item.materialId})`,
          unitCode: item.unitCode || 'KG',
        };
      }

      const lineBase = item.orderedQty * item.unitPrice;
      const rate = item.taxRate !== undefined ? item.taxRate : 5.0; // default 5% GST
      const lineTax = (lineBase * rate) / 100;
      const lineTotal = Number((lineBase + lineTax).toFixed(2));

      subtotal += lineBase;
      taxAmount += lineTax;

      return {
        id: `poi-${id}-${idx + 1}`,
        itemType: item.itemType,
        materialId: resolvedItem.id,
        materialCode: resolvedItem.itemCode,
        materialName: resolvedItem.itemName,
        orderedQty: item.orderedQty,
        unitCode: resolvedItem.unitCode,
        unitPrice: item.unitPrice,
        taxRate: rate,
        lineTotal,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    const newPO: PurchaseOrderDTO = {
      id,
      poNumber,
      supplierId: supplier ? supplier.id : req.supplierId,
      supplierName,
      supplierInvoiceNumber: req.supplierInvoiceNumber,
      orderDate: req.orderDate || new Date().toISOString(),
      expectedDeliveryDate: req.expectedDeliveryDate,
      status: 'DRAFT',
      items: lineItems,
      subtotal,
      taxAmount,
      totalAmount,
      createdBy: req.createdBy,
      createdByName: req.createdByName || 'Procurement Officer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    purchasesStore.purchases.set(id, newPO);

    await recordSecurityAudit({
      userId: req.createdBy,
      entityName: 'PURCHASE_ORDER',
      entityId: newPO.id,
      actionType: 'CREATE',
      newValues: {
        poNumber,
        supplierName,
        totalAmount,
        itemCount: lineItems.length,
      },
    });

    return newPO;
  }

  /**
   * 4. CONFIRM PURCHASE & ISSUE GOODS RECEIPT NOTE (GRN)
   * This is the core trigger that:
   * 1. Marks PO as 'RECEIVED' (or CONFIRMED)
   * 2. Automatically increases raw material or packaging stock
   * 3. Calculates weighted-average rate
   * 4. Appends to the stock ledger
   */
  static async confirmPurchase(params: {
    purchaseId: string;
    supplierInvoiceNumber?: string;
    confirmedBy: string;
    confirmedByName?: string;
  }): Promise<PurchaseOrderDTO> {
    const po = this.getPurchaseById(params.purchaseId);

    if (po.status === 'RECEIVED') {
      throw new BadRequestError(`Purchase order ${po.poNumber} has already been received and GRN generated.`);
    }

    if (po.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot confirm cancelled purchase order ${po.poNumber}.`);
    }

    if (params.supplierInvoiceNumber) {
      po.supplierInvoiceNumber = params.supplierInvoiceNumber;
    }

    purchasesStore.grnSequence += 1;
    const grnNumber = `GRN-2026-${purchasesStore.grnSequence.toString().padStart(5, '0')}`;
    const receivedAt = new Date().toISOString();

    // Automatically increase inventory for each purchased item
    for (const item of po.items) {
      await InventoryService.recordStockMovement({
        itemId: item.materialId,
        movementType: 'GRN_RECEIPT',
        sourceDocumentType: 'PURCHASE_GRN',
        sourceDocumentId: grnNumber,
        quantity: item.orderedQty,
        unitCost: item.unitPrice,
        performedBy: params.confirmedBy,
        performerName: params.confirmedByName,
        notes: `GRN Receipt against PO #${po.poNumber} (Supplier Inv: ${po.supplierInvoiceNumber || 'N/A'})`,
      });
    }

    po.status = 'RECEIVED';
    po.grnNumber = grnNumber;
    po.receivedAt = receivedAt;
    po.updatedAt = receivedAt;

    await recordSecurityAudit({
      userId: params.confirmedBy,
      entityName: 'PURCHASE_GRN',
      entityId: grnNumber,
      actionType: 'POST',
      newValues: {
        poNumber: po.poNumber,
        grnNumber,
        totalAmount: po.totalAmount,
        supplierName: po.supplierName,
      },
    });

    return po;
  }
}
