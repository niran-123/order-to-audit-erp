/**
 * Inventory & Purchases Validation Schemas (Zod)
 * Order-to-Audit Manufacturing ERP
 */

import { z } from 'zod';

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().datetime({ offset: true }).optional().or(z.string().min(1)),
  expectedDeliveryDate: z.string().datetime({ offset: true }).optional().or(z.string().min(1)),
  supplierInvoiceNumber: z.string().max(100).optional(),
  items: z
    .array(
      z.object({
        itemType: z.enum(['RAW_MATERIAL', 'PACKAGING_MATERIAL']),
        materialId: z.string().min(1, 'Material ID/code is required'),
        orderedQty: z.number().positive('Quantity must be strictly greater than 0'),
        unitCode: z.string().optional(),
        unitPrice: z.number().positive('Unit price must be strictly greater than 0'),
        taxRate: z.number().min(0).max(100).optional(),
      })
    )
    .min(1, 'At least one line item is required in a purchase order'),
});

export const confirmPurchaseSchema = z.object({
  supplierInvoiceNumber: z.string().max(100).optional(),
});

export const reconcileStockSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  physicalCount: z.number().min(0, 'Physical count cannot be negative'),
  reason: z.string().min(3, 'Reconciliation reason is required (min 3 chars)'),
});

export const recordManualMovementSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  movementType: z.enum([
    'OPENING_BALANCE',
    'GRN_RECEIPT',
    'PRODUCTION_ISSUE',
    'PRODUCTION_RETURN',
    'FG_RECEIPT',
    'DISPATCH_OUT',
    'STOCK_ADJUSTMENT',
    'SCRAP_DISPOSAL',
  ]),
  sourceDocumentType: z.enum([
    'OPENING_SETUP',
    'PURCHASE_GRN',
    'PRODUCTION_RUN',
    'SALES_DISPATCH',
    'STOCK_RECONCILIATION',
  ]),
  sourceDocumentId: z.string().min(1, 'Source Document ID is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitCost: z.number().positive().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const stockLedgerQuerySchema = z.object({
  itemId: z.string().optional(),
  category: z.enum(['RAW_MATERIAL', 'PACKAGING_MATERIAL', 'WORK_IN_PROGRESS', 'FINISHED_GOODS']).optional(),
  movementType: z.enum([
    'OPENING_BALANCE',
    'GRN_RECEIPT',
    'PRODUCTION_ISSUE',
    'PRODUCTION_RETURN',
    'FG_RECEIPT',
    'DISPATCH_OUT',
    'STOCK_ADJUSTMENT',
    'SCRAP_DISPOSAL',
  ]).optional(),
  sourceDocumentType: z.enum([
    'OPENING_SETUP',
    'PURCHASE_GRN',
    'PRODUCTION_RUN',
    'SALES_DISPATCH',
    'STOCK_RECONCILIATION',
  ]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
