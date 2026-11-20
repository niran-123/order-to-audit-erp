/**
 * Production & BOM Request Validation Schemas (Zod)
 * Order-to-Audit Manufacturing ERP
 */

import { z } from 'zod';

export const createBOMSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  version: z.string().min(1, 'BOM version is required (e.g. V1.0)'),
  batchSize: z.number().positive('Batch size must be greater than zero'),
  batchUnit: z.string().optional().default('PKT'),
  expectedOutput: z.number().positive('Expected output must be greater than zero'),
  effectiveDate: z.string().datetime({ offset: true }).optional().or(z.string().min(1)),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        itemType: z.enum(['RAW_MATERIAL', 'PACKAGING_MATERIAL']),
        materialId: z.string().min(1, 'Material ID/code is required'),
        standardQty: z.number().positive('Standard quantity must be strictly greater than zero'),
        unitCode: z.string().min(1, 'Unit code is required'),
        expectedWastagePct: z.number().min(0).max(100).optional().default(0),
      })
    )
    .min(1, 'BOM must contain at least one line item'),
});

export const createProductionRunSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  bomId: z.string().min(1, 'BOM ID is required'),
  plannedBatchSize: z.number().positive().optional(),
  plannedOutput: z.number().positive('Planned output must be strictly greater than zero'),
  productionDate: z.string().datetime({ offset: true }).optional().or(z.string().min(1)),
  supervisorId: z.string().min(1, 'Supervisor ID is required').optional(),
  supervisorName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const completeProductionRunSchema = z.object({
  actualGoodOutput: z.number().positive('Actual good output must be strictly greater than zero'),
  damagedOutput: z.number().min(0).optional().default(0),
  damagedPackagingQty: z.number().min(0).optional().default(0),
  materials: z
    .array(
      z.object({
        materialId: z.string().min(1, 'Material ID is required'),
        actualQty: z.number().positive('Actual quantity must be positive'),
      })
    )
    .min(1, 'Material actual consumption list is required'),
  overheads: z
    .object({
      labourCost: z.number().min(0).optional().default(0),
      gasCost: z.number().min(0).optional().default(0),
      electricityCost: z.number().min(0).optional().default(0),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});
