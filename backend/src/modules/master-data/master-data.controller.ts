import { Request, Response, NextFunction } from 'express';
import { MasterDataService } from './master-data.service';
import { sendSuccess } from '../../utils/apiResponse';

export class MasterDataController {
  // ==========================================
  // CUSTOMERS
  // ==========================================
  static getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listCustomers(req.query as any);
      return sendSuccess(res, result, 'Customers retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static getCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.getCustomerById(req.params.id);
      return sendSuccess(res, result, 'Customer retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createCustomer(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Customer registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updateCustomer(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'Customer updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deactivateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivateCustomer(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'Customer status changed to INACTIVE');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  static getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listSuppliers(req.query as any);
      return sendSuccess(res, result, 'Suppliers retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static getSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.getSupplierById(req.params.id);
      return sendSuccess(res, result, 'Supplier retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createSupplier(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Supplier registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updateSupplier(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'Supplier updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deactivateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivateSupplier(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'Supplier status changed to INACTIVE');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // CATEGORIES
  // ==========================================
  static getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listCategories(req.query as any);
      return sendSuccess(res, result, 'Product categories retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createCategory(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Product category created', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updateCategory(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'Product category updated');
    } catch (err) {
      next(err);
    }
  }

  static async deactivateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivateCategory(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'Category deactivated');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // UNITS & CONVERSIONS
  // ==========================================
  static getUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listUnits(req.query as any);
      return sendSuccess(res, result, 'Units of measurement retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createUnit(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Unit created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static getConversions(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listConversions();
      return sendSuccess(res, result, 'Unit conversions retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createConversion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createConversion(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Unit conversion registered', 201);
    } catch (err) {
      next(err);
    }
  }

  static convertQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const { qty, fromUnit, toUnit, productId } = req.query;
      const converted = MasterDataService.convertQuantity(
        parseFloat(qty as string),
        fromUnit as string,
        toUnit as string,
        productId as string,
      );
      return sendSuccess(res, { qty: parseFloat(qty as string), fromUnit, toUnit, convertedQty: converted }, 'Conversion calculated');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  static getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listProducts(req.query as any);
      return sendSuccess(res, result, 'Products retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.getProductById(req.params.id);
      return sendSuccess(res, result, 'Product details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createProduct(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Product catalog item created', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updateProduct(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deactivateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivateProduct(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'Product deactivated');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // RAW MATERIALS
  // ==========================================
  static getRawMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listRawMaterials(req.query as any);
      return sendSuccess(res, result, 'Raw materials retrieved');
    } catch (err) {
      next(err);
    }
  }

  static getRawMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.getRawMaterialById(req.params.id);
      return sendSuccess(res, result, 'Raw material details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createRawMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createRawMaterial(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Raw material registered', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateRawMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updateRawMaterial(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'Raw material updated');
    } catch (err) {
      next(err);
    }
  }

  static async deactivateRawMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivateRawMaterial(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'Raw material deactivated');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PACKAGING MATERIALS
  // ==========================================
  static getPackagingMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listPackagingMaterials(req.query as any);
      return sendSuccess(res, result, 'Packaging materials retrieved');
    } catch (err) {
      next(err);
    }
  }

  static getPackagingMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.getPackagingMaterialById(req.params.id);
      return sendSuccess(res, result, 'Packaging material details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createPackagingMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createPackagingMaterial(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Packaging material registered', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updatePackagingMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updatePackagingMaterial(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'Packaging material updated');
    } catch (err) {
      next(err);
    }
  }

  static async deactivatePackagingMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivatePackagingMaterial(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'Packaging material deactivated');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // SELLING PRICES
  // ==========================================
  static getSellingPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listSellingPrices(req.query.productId as string);
      return sendSuccess(res, result, 'Selling price tiers retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createSellingPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createSellingPrice(req.body, req.user?.userId);
      return sendSuccess(res, result, 'Price tier registered', 201);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // BILL OF MATERIALS (BOM)
  // ==========================================
  static getBOMs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.listBOMs(req.query as any);
      return sendSuccess(res, result, 'Bill of Materials retrieved');
    } catch (err) {
      next(err);
    }
  }

  static getBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = MasterDataService.getBOMById(req.params.id);
      return sendSuccess(res, result, 'BOM details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.createBOM(req.body, req.user?.userId);
      return sendSuccess(res, result, 'BOM master formula created', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.updateBOM(req.params.id, req.body, req.user?.userId);
      return sendSuccess(res, result, 'BOM updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deactivateBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.deactivateBOM(req.params.id, req.user?.userId);
      return sendSuccess(res, result, 'BOM status marked as OBSOLETE');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // CSV EXPORT
  // ==========================================
  static exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const moduleName = req.params.module;
      const csv = MasterDataService.exportCsv(moduleName);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${moduleName}-export.csv"`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
