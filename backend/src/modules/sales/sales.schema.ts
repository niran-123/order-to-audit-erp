import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  expectedDeliveryDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        orderedQty: z.number().positive('Quantity must be greater than zero'),
        unitPrice: z.number().positive('Unit price must be greater than zero').optional(),
      })
    )
    .min(1, 'Order must contain at least one item'),
});

export const approveOrderSchema = z.object({
  notes: z.string().optional(),
});

export const rejectOrderSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
});

export const createDispatchSchema = z.object({
  carrierName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        salesOrderItemId: z.string().optional(),
        productId: z.string().min(1, 'Product is required'),
        dispatchedQty: z.number().positive('Dispatch quantity must be greater than zero'),
      })
    )
    .min(1, 'At least one item must be dispatched'),
});

export const checkStockAvailabilitySchema = z.object({
  requestedQty: z.coerce.number().positive('Requested quantity must be positive'),
});
