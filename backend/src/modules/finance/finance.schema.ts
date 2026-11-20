import { z } from 'zod';

export const recordPaymentSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  invoiceId: z.string().optional(),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'NEFT', 'RTGS', 'CHEQUE', 'UPI', 'CASH']),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().min(2, 'Transaction reference number is required'),
  bankName: z.string().optional(),
  allocations: z
    .array(
      z.object({
        invoiceId: z.string().min(1, 'Invoice ID is required'),
        amount: z.number().positive('Allocation amount must be greater than zero'),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export const productionCostingOverrideSchema = z.object({
  runId: z.string().optional(),
  labourCost: z.number().nonnegative().optional(),
  gasPowerCost: z.number().nonnegative().optional(),
  otherOverheads: z.number().nonnegative().optional(),
});
