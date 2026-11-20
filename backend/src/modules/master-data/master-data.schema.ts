import { z } from 'zod';

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'DRAFT', 'OBSOLETE']).optional(),
    categoryId: z.string().optional(),
  }),
});

export const customerSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Customer code must have at least 2 characters').max(50),
    businessName: z.string().min(2, 'Business name is required').max(200),
    customerType: z.enum(['RETAILER', 'DISTRIBUTOR', 'WHOLESALER', 'INSTITUTIONAL']),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (15 characters)').optional().or(z.literal('')),
    pan: z.string().optional(),
    contactPerson: z.string().min(2, 'Contact person is required'),
    phone: z.string().min(7, 'Phone number is required').max(25),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    billingAddress: z.string().min(5, 'Billing address is required'),
    shippingAddress: z.string().min(5, 'Shipping address is required'),
    state: z.string().min(2, 'State is required'),
    stateCode: z.string().min(2, 'State code is required').max(5),
    creditLimit: z.number().nonnegative('Credit limit cannot be negative').default(0),
    creditDays: z.number().int().nonnegative('Credit days cannot be negative').default(30),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).default('ACTIVE'),
  }),
});

export const supplierSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Supplier code is required').max(50),
    name: z.string().min(2, 'Supplier name is required').max(200),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
    pan: z.string().optional(),
    contactPerson: z.string().min(2, 'Contact person is required'),
    phone: z.string().min(7, 'Phone is required').max(25),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().min(5, 'Address is required'),
    state: z.string().min(2, 'State is required'),
    stateCode: z.string().optional(),
    paymentTerms: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).default('ACTIVE'),
  }),
});

export const productCategorySchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Category code is required').max(50),
    name: z.string().min(2, 'Category name is required').max(100),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const unitSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Unit code is required').max(20),
    name: z.string().min(2, 'Unit name is required').max(50),
    symbol: z.string().min(1, 'Unit symbol is required').max(10),
    unitType: z.enum(['WEIGHT', 'VOLUME', 'COUNT']),
    isBaseUnit: z.boolean().default(false),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const unitConversionSchema = z.object({
  body: z.object({
    fromUnitId: z.string().min(1, 'From unit is required'),
    toUnitId: z.string().min(1, 'To unit is required'),
    multiplier: z.number().positive('Multiplier must be greater than zero'),
    productId: z.string().nullable().optional(),
  }),
});

export const productSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Product code is required').max(50),
    name: z.string().min(2, 'Product name is required').max(200),
    categoryId: z.string().min(1, 'Category is required'),
    packSize: z.string().min(1, 'Pack size is required'),
    sellingPrice: z.number().positive('Selling price must be positive'),
    gstRate: z.number().nonnegative('GST rate must be non-negative'),
    hsnCode: z.string().min(4, 'HSN code is required').max(20),
    unitId: z.string().min(1, 'Unit is required'),
    description: z.string().optional(),
    minOrderQty: z.number().positive().default(1),
    safetyStock: z.number().nonnegative().default(0),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const rawMaterialSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Material code is required').max(50),
    name: z.string().min(2, 'Material name is required').max(200),
    unitId: z.string().min(1, 'Unit is required'),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    reorderLevel: z.number().nonnegative('Reorder level must be non-negative'),
    defaultPurchaseRate: z.number().positive('Default purchase rate must be positive'),
    safetyStock: z.number().nonnegative().default(0),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const packagingMaterialSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Material code is required').max(50),
    name: z.string().min(2, 'Material name is required').max(200),
    unitId: z.string().min(1, 'Unit is required'),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    purchaseRate: z.number().positive('Purchase rate must be positive'),
    reorderLevel: z.number().nonnegative('Reorder level must be non-negative'),
    safetyStock: z.number().nonnegative().default(0),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const sellingPriceSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product is required'),
    customerType: z.enum(['RETAILER', 'DISTRIBUTOR', 'WHOLESALER', 'INSTITUTIONAL', 'ALL']).default('ALL'),
    tierName: z.string().min(2, 'Tier name is required').max(100),
    price: z.number().positive('Price must be positive'),
    minQty: z.number().positive('Minimum quantity must be positive').default(1),
    effectiveFrom: z.string().default(new Date().toISOString()),
    effectiveTo: z.string().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  }),
});

export const bomItemSchema = z.object({
  itemType: z.enum(['RAW_MATERIAL', 'PACKAGING_MATERIAL']),
  materialId: z.string().min(1, 'Material is required'),
  standardQty: z.number().positive('Standard quantity must be positive'),
  scrapPercentage: z.number().nonnegative().max(100).default(0),
  unitId: z.string().min(1, 'Unit is required'),
});

export const billOfMaterialSchema = z.object({
  body: z.object({
    bomNumber: z.string().min(2, 'BOM number is required').max(50),
    productId: z.string().min(1, 'Product is required'),
    version: z.string().min(1, 'Version is required').max(20),
    batchSize: z.number().positive('Batch size must be positive'),
    unitId: z.string().min(1, 'Unit is required'),
    status: z.enum(['DRAFT', 'ACTIVE', 'OBSOLETE']).default('DRAFT'),
    effectiveDate: z.string().default(new Date().toISOString()),
    items: z.array(bomItemSchema).min(1, 'BOM must contain at least one item'),
  }),
});
