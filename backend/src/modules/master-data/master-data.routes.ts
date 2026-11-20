import { Router } from 'express';
import { MasterDataController } from './master-data.controller';
import { authenticate, preventAuditorModifications, requireRoles } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import {
  customerSchema,
  supplierSchema,
  productCategorySchema,
  unitSchema,
  unitConversionSchema,
  productSchema,
  rawMaterialSchema,
  packagingMaterialSchema,
  sellingPriceSchema,
  billOfMaterialSchema,
  paginationSchema,
} from './master-data.schema';

const router = Router();

// Master Data is accessible to authenticated personnel, read-only to Auditor
router.use(authenticate);
router.use(preventAuditorModifications);

// 1. CUSTOMERS
router.get('/customers', validateRequest(paginationSchema), MasterDataController.getCustomers);
router.get('/customers/:id', MasterDataController.getCustomer);
router.post(
  '/customers',
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'),
  validateRequest(customerSchema),
  MasterDataController.createCustomer,
);
router.put(
  '/customers/:id',
  requireRoles('ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'),
  validateRequest(customerSchema),
  MasterDataController.updateCustomer,
);
router.patch('/customers/:id/deactivate', requireRoles('ADMIN', 'OWNER'), MasterDataController.deactivateCustomer);

// 2. SUPPLIERS
router.get('/suppliers', validateRequest(paginationSchema), MasterDataController.getSuppliers);
router.get('/suppliers/:id', MasterDataController.getSupplier);
router.post(
  '/suppliers',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  validateRequest(supplierSchema),
  MasterDataController.createSupplier,
);
router.put(
  '/suppliers/:id',
  requireRoles('ADMIN', 'OWNER', 'ACCOUNTANT'),
  validateRequest(supplierSchema),
  MasterDataController.updateSupplier,
);
router.patch('/suppliers/:id/deactivate', requireRoles('ADMIN', 'OWNER'), MasterDataController.deactivateSupplier);

// 3. PRODUCT CATEGORIES
router.get('/categories', validateRequest(paginationSchema), MasterDataController.getCategories);
router.post(
  '/categories',
  requireRoles('ADMIN', 'OWNER'),
  validateRequest(productCategorySchema),
  MasterDataController.createCategory,
);
router.put(
  '/categories/:id',
  requireRoles('ADMIN', 'OWNER'),
  validateRequest(productCategorySchema),
  MasterDataController.updateCategory,
);
router.patch('/categories/:id/deactivate', requireRoles('ADMIN', 'OWNER'), MasterDataController.deactivateCategory);

// 4. UNITS OF MEASUREMENT
router.get('/units', validateRequest(paginationSchema), MasterDataController.getUnits);
router.post('/units', requireRoles('ADMIN', 'OWNER'), validateRequest(unitSchema), MasterDataController.createUnit);

// 5. UNIT CONVERSIONS
router.get('/conversions', MasterDataController.getConversions);
router.get('/conversions/convert', MasterDataController.convertQuantity);
router.post(
  '/conversions',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(unitConversionSchema),
  MasterDataController.createConversion,
);

// 6. PRODUCTS
router.get('/products', validateRequest(paginationSchema), MasterDataController.getProducts);
router.get('/products/:id', MasterDataController.getProduct);
router.post(
  '/products',
  requireRoles('ADMIN', 'OWNER'),
  validateRequest(productSchema),
  MasterDataController.createProduct,
);
router.put(
  '/products/:id',
  requireRoles('ADMIN', 'OWNER'),
  validateRequest(productSchema),
  MasterDataController.updateProduct,
);
router.patch('/products/:id/deactivate', requireRoles('ADMIN', 'OWNER'), MasterDataController.deactivateProduct);

// 7. RAW MATERIALS
router.get('/raw-materials', validateRequest(paginationSchema), MasterDataController.getRawMaterials);
router.get('/raw-materials/:id', MasterDataController.getRawMaterial);
router.post(
  '/raw-materials',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(rawMaterialSchema),
  MasterDataController.createRawMaterial,
);
router.put(
  '/raw-materials/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(rawMaterialSchema),
  MasterDataController.updateRawMaterial,
);
router.patch('/raw-materials/:id/deactivate', requireRoles('ADMIN', 'OWNER'), MasterDataController.deactivateRawMaterial);

// 8. PACKAGING MATERIALS
router.get('/packaging-materials', validateRequest(paginationSchema), MasterDataController.getPackagingMaterials);
router.get('/packaging-materials/:id', MasterDataController.getPackagingMaterial);
router.post(
  '/packaging-materials',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(packagingMaterialSchema),
  MasterDataController.createPackagingMaterial,
);
router.put(
  '/packaging-materials/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(packagingMaterialSchema),
  MasterDataController.updatePackagingMaterial,
);
router.patch(
  '/packaging-materials/:id/deactivate',
  requireRoles('ADMIN', 'OWNER'),
  MasterDataController.deactivatePackagingMaterial,
);

// 9. SELLING PRICE TIERS
router.get('/pricing', MasterDataController.getSellingPrices);
router.post(
  '/pricing',
  requireRoles('ADMIN', 'OWNER'),
  validateRequest(sellingPriceSchema),
  MasterDataController.createSellingPrice,
);

// 10. BILL OF MATERIALS (BOM)
router.get('/boms', validateRequest(paginationSchema), MasterDataController.getBOMs);
router.get('/boms/:id', MasterDataController.getBOM);
router.post(
  '/boms',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(billOfMaterialSchema),
  MasterDataController.createBOM,
);
router.put(
  '/boms/:id',
  requireRoles('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR'),
  validateRequest(billOfMaterialSchema),
  MasterDataController.updateBOM,
);
router.patch('/boms/:id/deactivate', requireRoles('ADMIN', 'OWNER'), MasterDataController.deactivateBOM);

// CSV EXPORT
router.get('/export/:module', MasterDataController.exportCsv);

export default router;
