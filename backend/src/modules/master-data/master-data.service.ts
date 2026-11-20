/**
 * Master Data Service
 * Comprehensive CRUD, Pagination, Duplicate Prevention, Search/Filter, CSV Export,
 * and Security Audit Logging for all 10 Master Data Modules.
 */

import {
  CustomerDTO,
  SupplierDTO,
  ProductCategoryDTO,
  UnitDTO,
  UnitConversionDTO,
  ProductDTO,
  RawMaterialDTO,
  PackagingMaterialDTO,
  SellingPriceDTO,
  BillOfMaterialDTO,
  PaginatedResult,
  PaginationParams,
} from './master-data.types';
import {
  BENCHMARK_UNITS,
  BENCHMARK_UNIT_CONVERSIONS,
  BENCHMARK_CATEGORIES,
  BENCHMARK_RAW_MATERIALS,
  BENCHMARK_PACKAGING_MATERIALS,
  BENCHMARK_PRODUCTS,
  BENCHMARK_SELLING_PRICES,
  BENCHMARK_BOMS,
  BENCHMARK_CUSTOMERS,
  BENCHMARK_SUPPLIERS,
} from './master-data.benchmark';
import { ConflictError, NotFoundError } from '../../utils/appError';
import { recordSecurityAudit } from '../audit/audit.service';

class MasterDataStore {
  public units: UnitDTO[] = JSON.parse(JSON.stringify(BENCHMARK_UNITS));
  public conversions: UnitConversionDTO[] = JSON.parse(JSON.stringify(BENCHMARK_UNIT_CONVERSIONS));
  public categories: ProductCategoryDTO[] = JSON.parse(JSON.stringify(BENCHMARK_CATEGORIES));
  public rawMaterials: RawMaterialDTO[] = JSON.parse(JSON.stringify(BENCHMARK_RAW_MATERIALS));
  public packagingMaterials: PackagingMaterialDTO[] = JSON.parse(JSON.stringify(BENCHMARK_PACKAGING_MATERIALS));
  public products: ProductDTO[] = JSON.parse(JSON.stringify(BENCHMARK_PRODUCTS));
  public sellingPrices: SellingPriceDTO[] = JSON.parse(JSON.stringify(BENCHMARK_SELLING_PRICES));
  public boms: BillOfMaterialDTO[] = JSON.parse(JSON.stringify(BENCHMARK_BOMS));
  public customers: CustomerDTO[] = JSON.parse(JSON.stringify(BENCHMARK_CUSTOMERS));
  public suppliers: SupplierDTO[] = JSON.parse(JSON.stringify(BENCHMARK_SUPPLIERS));
}

export const store = new MasterDataStore();

function paginate<T>(items: T[], params: PaginationParams): PaginatedResult<T> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 10));
  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginated = items.slice(offset, offset + limit);

  return {
    items: paginated,
    total,
    page,
    limit,
    totalPages,
  };
}

export class MasterDataService {
  // ==========================================
  // 1. CUSTOMERS
  // ==========================================
  static listCustomers(params: PaginationParams): PaginatedResult<CustomerDTO> {
    let list = [...store.customers];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.businessName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          (c.gstin && c.gstin.toLowerCase().includes(q)),
      );
    }
    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }
    return paginate(list, params);
  }

  static getCustomerById(id: string): CustomerDTO {
    const customer = store.customers.find((c) => c.id === id || c.code.toLowerCase() === id.toLowerCase());
    if (!customer) throw new NotFoundError(`Customer not found with identifier: ${id}`);
    return customer;
  }

  static async createCustomer(data: Omit<CustomerDTO, 'id' | 'createdAt' | 'updatedAt'>, actorUserId?: string): Promise<CustomerDTO> {
    const exists = store.customers.some((c) => c.code.toLowerCase() === data.code.toLowerCase());
    if (exists) {
      throw new ConflictError(`Customer code "${data.code}" already exists in master registry.`);
    }

    const now = new Date().toISOString();
    const newCustomer: CustomerDTO = {
      ...data,
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.customers.unshift(newCustomer);

    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'CUSTOMER',
      entityId: newCustomer.id,
      actionType: 'CREATE',
      newValues: newCustomer as unknown as Record<string, unknown>,
    });

    return newCustomer;
  }

  static async updateCustomer(id: string, data: Partial<CustomerDTO>, actorUserId?: string): Promise<CustomerDTO> {
    const index = store.customers.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundError(`Customer not found with id: ${id}`);

    const existing = store.customers[index];
    if (data.code && data.code.toLowerCase() !== existing.code.toLowerCase()) {
      const codeTaken = store.customers.some((c) => c.id !== id && c.code.toLowerCase() === data.code?.toLowerCase());
      if (codeTaken) throw new ConflictError(`Customer code "${data.code}" is already in use.`);
    }

    const updated: CustomerDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.customers[index] = updated;

    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'CUSTOMER',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  static async deactivateCustomer(id: string, actorUserId?: string): Promise<CustomerDTO> {
    return this.updateCustomer(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 2. SUPPLIERS
  // ==========================================
  static listSuppliers(params: PaginationParams): PaginatedResult<SupplierDTO> {
    let list = [...store.suppliers];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          (s.gstin && s.gstin.toLowerCase().includes(q)),
      );
    }
    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    return paginate(list, params);
  }

  static getSupplierById(id: string): SupplierDTO {
    const supplier = store.suppliers.find((s) => s.id === id || s.code.toLowerCase() === id.toLowerCase());
    if (!supplier) throw new NotFoundError(`Supplier not found with identifier: ${id}`);
    return supplier;
  }

  static async createSupplier(data: Omit<SupplierDTO, 'id' | 'createdAt' | 'updatedAt'>, actorUserId?: string): Promise<SupplierDTO> {
    const exists = store.suppliers.some((s) => s.code.toLowerCase() === data.code.toLowerCase());
    if (exists) throw new ConflictError(`Supplier code "${data.code}" already exists.`);

    const now = new Date().toISOString();
    const newSupplier: SupplierDTO = {
      ...data,
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.suppliers.unshift(newSupplier);

    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'SUPPLIER',
      entityId: newSupplier.id,
      actionType: 'CREATE',
      newValues: newSupplier as unknown as Record<string, unknown>,
    });

    return newSupplier;
  }

  static async updateSupplier(id: string, data: Partial<SupplierDTO>, actorUserId?: string): Promise<SupplierDTO> {
    const index = store.suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new NotFoundError(`Supplier not found with id: ${id}`);

    const existing = store.suppliers[index];
    if (data.code && data.code.toLowerCase() !== existing.code.toLowerCase()) {
      const codeTaken = store.suppliers.some((s) => s.id !== id && s.code.toLowerCase() === data.code?.toLowerCase());
      if (codeTaken) throw new ConflictError(`Supplier code "${data.code}" is already in use.`);
    }

    const updated: SupplierDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.suppliers[index] = updated;

    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'SUPPLIER',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  static async deactivateSupplier(id: string, actorUserId?: string): Promise<SupplierDTO> {
    return this.updateSupplier(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 3. PRODUCT CATEGORIES
  // ==========================================
  static listCategories(params: PaginationParams): PaginatedResult<ProductCategoryDTO> {
    let list = [...store.categories];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }
    return paginate(list, params);
  }

  static getCategoryById(id: string): ProductCategoryDTO {
    const cat = store.categories.find((c) => c.id === id || c.code.toLowerCase() === id.toLowerCase());
    if (!cat) throw new NotFoundError(`Category not found: ${id}`);
    return cat;
  }

  static async createCategory(data: Omit<ProductCategoryDTO, 'id' | 'createdAt' | 'updatedAt'>, actorUserId?: string): Promise<ProductCategoryDTO> {
    const exists = store.categories.some((c) => c.code.toLowerCase() === data.code.toLowerCase());
    if (exists) throw new ConflictError(`Category code "${data.code}" already exists.`);

    const now = new Date().toISOString();
    let parentName = null;
    if (data.parentId) {
      const parent = store.categories.find((c) => c.id === data.parentId);
      if (parent) parentName = parent.name;
    }

    const newCat: ProductCategoryDTO = {
      ...data,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      parentName,
      createdAt: now,
      updatedAt: now,
    };

    store.categories.push(newCat);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'PRODUCT_CATEGORY',
      entityId: newCat.id,
      actionType: 'CREATE',
      newValues: newCat as unknown as Record<string, unknown>,
    });
    return newCat;
  }

  static async updateCategory(id: string, data: Partial<ProductCategoryDTO>, actorUserId?: string): Promise<ProductCategoryDTO> {
    const index = store.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundError(`Category not found: ${id}`);

    const existing = store.categories[index];
    const updated: ProductCategoryDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.categories[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'PRODUCT_CATEGORY',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  static async deactivateCategory(id: string, actorUserId?: string): Promise<ProductCategoryDTO> {
    return this.updateCategory(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 4. UNITS OF MEASUREMENT
  // ==========================================
  static listUnits(params: PaginationParams): PaginatedResult<UnitDTO> {
    let list = [...store.units];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((u) => u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    }
    if (params.status) {
      list = list.filter((u) => u.status === params.status);
    }
    return paginate(list, params);
  }

  static getUnitById(id: string): UnitDTO {
    const unit = store.units.find((u) => u.id === id || u.code.toUpperCase() === id.toUpperCase());
    if (!unit) throw new NotFoundError(`Unit not found: ${id}`);
    return unit;
  }

  static async createUnit(data: Omit<UnitDTO, 'id' | 'createdAt' | 'updatedAt'>, actorUserId?: string): Promise<UnitDTO> {
    const exists = store.units.some((u) => u.code.toUpperCase() === data.code.toUpperCase());
    if (exists) throw new ConflictError(`Unit code "${data.code}" already exists.`);

    const now = new Date().toISOString();
    const newUnit: UnitDTO = {
      ...data,
      code: data.code.toUpperCase(),
      id: `unit-${data.code.toLowerCase()}-${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.units.push(newUnit);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'UNIT',
      entityId: newUnit.id,
      actionType: 'CREATE',
      newValues: newUnit as unknown as Record<string, unknown>,
    });
    return newUnit;
  }

  static async updateUnit(id: string, data: Partial<UnitDTO>, actorUserId?: string): Promise<UnitDTO> {
    const index = store.units.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundError(`Unit not found: ${id}`);

    const existing = store.units[index];
    const updated: UnitDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.units[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'UNIT',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  static async deactivateUnit(id: string, actorUserId?: string): Promise<UnitDTO> {
    return this.updateUnit(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 5. UNIT CONVERSIONS
  // ==========================================
  static listConversions(): UnitConversionDTO[] {
    return [...store.conversions];
  }

  static async createConversion(
    data: { fromUnitId: string; toUnitId: string; multiplier: number; productId?: string | null },
    actorUserId?: string,
  ): Promise<UnitConversionDTO> {
    const fromUnit = this.getUnitById(data.fromUnitId);
    const toUnit = this.getUnitById(data.toUnitId);

    const duplicate = store.conversions.some(
      (c) => c.fromUnitId === fromUnit.id && c.toUnitId === toUnit.id && c.productId === (data.productId || null),
    );
    if (duplicate) {
      throw new ConflictError(`Conversion between ${fromUnit.code} and ${toUnit.code} already exists.`);
    }

    let productName = null;
    if (data.productId) {
      const prod = store.products.find((p) => p.id === data.productId);
      if (prod) productName = prod.name;
    }

    const now = new Date().toISOString();
    const newConv: UnitConversionDTO = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromUnitId: fromUnit.id,
      fromUnitCode: fromUnit.code,
      toUnitId: toUnit.id,
      toUnitCode: toUnit.code,
      multiplier: data.multiplier,
      productId: data.productId || null,
      productName,
      createdAt: now,
      updatedAt: now,
    };

    store.conversions.push(newConv);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'UNIT_CONVERSION',
      entityId: newConv.id,
      actionType: 'CREATE',
      newValues: newConv as unknown as Record<string, unknown>,
    });
    return newConv;
  }

  static convertQuantity(qty: number, fromUnitCode: string, toUnitCode: string, productId?: string): number {
    if (fromUnitCode.toUpperCase() === toUnitCode.toUpperCase()) return qty;

    const direct = store.conversions.find(
      (c) =>
        c.fromUnitCode.toUpperCase() === fromUnitCode.toUpperCase() &&
        c.toUnitCode.toUpperCase() === toUnitCode.toUpperCase() &&
        (!productId || c.productId === productId || !c.productId),
    );

    if (direct) {
      return qty * direct.multiplier;
    }

    const reverse = store.conversions.find(
      (c) =>
        c.fromUnitCode.toUpperCase() === toUnitCode.toUpperCase() &&
        c.toUnitCode.toUpperCase() === fromUnitCode.toUpperCase() &&
        (!productId || c.productId === productId || !c.productId),
    );

    if (reverse && reverse.multiplier > 0) {
      return qty / reverse.multiplier;
    }

    throw new Error(`No mathematical conversion path defined between ${fromUnitCode} and ${toUnitCode}.`);
  }

  // ==========================================
  // 6. PRODUCTS (Murukku Benchmark)
  // ==========================================
  static listProducts(params: PaginationParams): PaginatedResult<ProductDTO> {
    let list = [...store.products];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.hsnCode.includes(q) ||
          p.packSize.toLowerCase().includes(q),
      );
    }
    if (params.categoryId) {
      list = list.filter((p) => p.categoryId === params.categoryId);
    }
    if (params.status) {
      list = list.filter((p) => p.status === params.status);
    }
    return paginate(list, params);
  }

  static getProductById(id: string): ProductDTO {
    const product = store.products.find((p) => p.id === id || p.code.toLowerCase() === id.toLowerCase());
    if (!product) throw new NotFoundError(`Product not found with identifier: ${id}`);
    return product;
  }

  static async createProduct(data: Omit<ProductDTO, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'unitCode'>, actorUserId?: string): Promise<ProductDTO> {
    const exists = store.products.some((p) => p.code.toLowerCase() === data.code.toLowerCase());
    if (exists) throw new ConflictError(`Product SKU/Code "${data.code}" already exists.`);

    const category = this.getCategoryById(data.categoryId);
    const unit = this.getUnitById(data.unitId);

    const now = new Date().toISOString();
    const newProduct: ProductDTO = {
      ...data,
      categoryName: category.name,
      unitCode: unit.code,
      id: `prd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.products.unshift(newProduct);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'PRODUCT',
      entityId: newProduct.id,
      actionType: 'CREATE',
      newValues: newProduct as unknown as Record<string, unknown>,
    });
    return newProduct;
  }

  static async updateProduct(id: string, data: Partial<ProductDTO>, actorUserId?: string): Promise<ProductDTO> {
    const index = store.products.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundError(`Product not found: ${id}`);

    const existing = store.products[index];
    if (data.code && data.code.toLowerCase() !== existing.code.toLowerCase()) {
      const codeTaken = store.products.some((p) => p.id !== id && p.code.toLowerCase() === data.code?.toLowerCase());
      if (codeTaken) throw new ConflictError(`Product SKU "${data.code}" is already in use.`);
    }

    let categoryName = existing.categoryName;
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      categoryName = this.getCategoryById(data.categoryId).name;
    }

    let unitCode = existing.unitCode;
    if (data.unitId && data.unitId !== existing.unitId) {
      unitCode = this.getUnitById(data.unitId).code;
    }

    const updated: ProductDTO = {
      ...existing,
      ...data,
      categoryName,
      unitCode,
      updatedAt: new Date().toISOString(),
    };

    store.products[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'PRODUCT',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  static async deactivateProduct(id: string, actorUserId?: string): Promise<ProductDTO> {
    return this.updateProduct(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 7. RAW MATERIALS
  // ==========================================
  static listRawMaterials(params: PaginationParams): PaginatedResult<RawMaterialDTO> {
    let list = [...store.rawMaterials];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    if (params.status) {
      list = list.filter((r) => r.status === params.status);
    }
    return paginate(list, params);
  }

  static getRawMaterialById(id: string): RawMaterialDTO {
    const item = store.rawMaterials.find((r) => r.id === id || r.code.toLowerCase() === id.toLowerCase());
    if (!item) throw new NotFoundError(`Raw Material not found: ${id}`);
    return item;
  }

  static async createRawMaterial(
    data: Omit<RawMaterialDTO, 'id' | 'createdAt' | 'updatedAt' | 'unitCode'>,
    actorUserId?: string,
  ): Promise<RawMaterialDTO> {
    const exists = store.rawMaterials.some((r) => r.code.toLowerCase() === data.code.toLowerCase());
    if (exists) throw new ConflictError(`Raw material code "${data.code}" already exists.`);

    const unit = this.getUnitById(data.unitId);
    const now = new Date().toISOString();
    const newMaterial: RawMaterialDTO = {
      ...data,
      unitCode: unit.code,
      id: `rm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.rawMaterials.push(newMaterial);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'RAW_MATERIAL',
      entityId: newMaterial.id,
      actionType: 'CREATE',
      newValues: newMaterial as unknown as Record<string, unknown>,
    });
    return newMaterial;
  }

  static async updateRawMaterial(id: string, data: Partial<RawMaterialDTO>, actorUserId?: string): Promise<RawMaterialDTO> {
    const index = store.rawMaterials.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundError(`Raw Material not found: ${id}`);

    const existing = store.rawMaterials[index];
    const updated: RawMaterialDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.rawMaterials[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'RAW_MATERIAL',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  static async deactivateRawMaterial(id: string, actorUserId?: string): Promise<RawMaterialDTO> {
    return this.updateRawMaterial(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 8. PACKAGING MATERIALS
  // ==========================================
  static listPackagingMaterials(params: PaginationParams): PaginatedResult<PackagingMaterialDTO> {
    let list = [...store.packagingMaterials];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    if (params.status) {
      list = list.filter((p) => p.status === params.status);
    }
    return paginate(list, params);
  }

  static getPackagingMaterialById(id: string): PackagingMaterialDTO {
    const item = store.packagingMaterials.find((p) => p.id === id || p.code.toLowerCase() === id.toLowerCase());
    if (!item) throw new NotFoundError(`Packaging Material not found: ${id}`);
    return item;
  }

  static async createPackagingMaterial(
    data: Omit<PackagingMaterialDTO, 'id' | 'createdAt' | 'updatedAt' | 'unitCode'>,
    actorUserId?: string,
  ): Promise<PackagingMaterialDTO> {
    const exists = store.packagingMaterials.some((p) => p.code.toLowerCase() === data.code.toLowerCase());
    if (exists) throw new ConflictError(`Packaging material code "${data.code}" already exists.`);

    const unit = this.getUnitById(data.unitId);
    const now = new Date().toISOString();
    const newMaterial: PackagingMaterialDTO = {
      ...data,
      unitCode: unit.code,
      id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.packagingMaterials.push(newMaterial);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'PACKAGING_MATERIAL',
      entityId: newMaterial.id,
      actionType: 'CREATE',
      newValues: newMaterial as unknown as Record<string, unknown>,
    });
    return newMaterial;
  }

  static async updatePackagingMaterial(id: string, data: Partial<PackagingMaterialDTO>, actorUserId?: string): Promise<PackagingMaterialDTO> {
    const index = store.packagingMaterials.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundError(`Packaging Material not found: ${id}`);

    const existing = store.packagingMaterials[index];
    const updated: PackagingMaterialDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.packagingMaterials[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'PACKAGING_MATERIAL',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  static async deactivatePackagingMaterial(id: string, actorUserId?: string): Promise<PackagingMaterialDTO> {
    return this.updatePackagingMaterial(id, { status: 'INACTIVE' }, actorUserId);
  }

  // ==========================================
  // 9. SELLING PRICE MANAGEMENT
  // ==========================================
  static listSellingPrices(productId?: string): SellingPriceDTO[] {
    if (productId) {
      return store.sellingPrices.filter((sp) => sp.productId === productId);
    }
    return [...store.sellingPrices];
  }

  static async createSellingPrice(data: Omit<SellingPriceDTO, 'id' | 'createdAt' | 'updatedAt' | 'productCode' | 'productName'>, actorUserId?: string): Promise<SellingPriceDTO> {
    const product = this.getProductById(data.productId);
    const now = new Date().toISOString();
    const newPrice: SellingPriceDTO = {
      ...data,
      productCode: product.code,
      productName: product.name,
      id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    store.sellingPrices.push(newPrice);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'SELLING_PRICE',
      entityId: newPrice.id,
      actionType: 'CREATE',
      newValues: newPrice as unknown as Record<string, unknown>,
    });
    return newPrice;
  }

  static async updateSellingPrice(id: string, data: Partial<SellingPriceDTO>, actorUserId?: string): Promise<SellingPriceDTO> {
    const index = store.sellingPrices.findIndex((sp) => sp.id === id);
    if (index === -1) throw new NotFoundError(`Price tier not found: ${id}`);

    const existing = store.sellingPrices[index];
    const updated: SellingPriceDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.sellingPrices[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'SELLING_PRICE',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  // ==========================================
  // 10. BILL OF MATERIALS (BOM MASTER)
  // ==========================================
  static listBOMs(params: PaginationParams): PaginatedResult<BillOfMaterialDTO> {
    let list = [...store.boms];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.bomNumber.toLowerCase().includes(q) ||
          b.productCode.toLowerCase().includes(q) ||
          b.productName.toLowerCase().includes(q),
      );
    }
    if (params.status) {
      list = list.filter((b) => b.status === params.status);
    }
    return paginate(list, params);
  }

  static getBOMById(id: string): BillOfMaterialDTO {
    const bom = store.boms.find((b) => b.id === id || b.bomNumber.toLowerCase() === id.toLowerCase());
    if (!bom) throw new NotFoundError(`BOM not found with identifier: ${id}`);
    return bom;
  }

  static async createBOM(
    data: {
      bomNumber: string;
      productId: string;
      version: string;
      batchSize: number;
      unitId: string;
      status: 'DRAFT' | 'ACTIVE' | 'OBSOLETE';
      items: Array<{
        itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
        materialId: string;
        standardQty: number;
        scrapPercentage: number;
        unitId: string;
      }>;
    },
    actorUserId?: string,
  ): Promise<BillOfMaterialDTO> {
    const exists = store.boms.some((b) => b.bomNumber.toLowerCase() === data.bomNumber.toLowerCase());
    if (exists) throw new ConflictError(`BOM Number "${data.bomNumber}" already exists.`);

    const product = this.getProductById(data.productId);
    const unit = this.getUnitById(data.unitId);

    let totalRaw = 0;
    let totalPack = 0;

    const resolvedItems = data.items.map((item, idx) => {
      let code = '';
      let name = '';
      let unitCost = 0;

      if (item.itemType === 'RAW_MATERIAL') {
        const rm = this.getRawMaterialById(item.materialId);
        code = rm.code;
        name = rm.name;
        unitCost = rm.defaultPurchaseRate;
      } else {
        const pm = this.getPackagingMaterialById(item.materialId);
        code = pm.code;
        name = pm.name;
        unitCost = pm.purchaseRate;
      }

      const itemUnit = this.getUnitById(item.unitId);
      // Accounting for standard quantity plus scrap allowance
      const effectiveQty = item.standardQty * (1 + item.scrapPercentage / 100);
      const lineCost = effectiveQty * unitCost;

      if (item.itemType === 'RAW_MATERIAL') totalRaw += lineCost;
      else totalPack += lineCost;

      return {
        id: `bom-item-${idx + 1}-${Date.now().toString(36)}`,
        itemType: item.itemType,
        materialId: item.materialId,
        materialCode: code,
        materialName: name,
        standardQty: item.standardQty,
        scrapPercentage: item.scrapPercentage,
        unitId: itemUnit.id,
        unitCode: itemUnit.code,
        unitCost,
        lineCost: Math.round(lineCost * 100) / 100,
      };
    });

    const totalBatchCost = totalRaw + totalPack;
    const costPerUnit = data.batchSize > 0 ? totalBatchCost / data.batchSize : 0;
    const now = new Date().toISOString();

    const newBOM: BillOfMaterialDTO = {
      id: `bom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bomNumber: data.bomNumber,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      version: data.version,
      batchSize: data.batchSize,
      unitId: unit.id,
      unitCode: unit.code,
      status: data.status,
      effectiveDate: now,
      approvedBy: actorUserId || null,
      items: resolvedItems,
      totalRawMaterialCost: Math.round(totalRaw * 100) / 100,
      totalPackagingCost: Math.round(totalPack * 100) / 100,
      totalBatchCost: Math.round(totalBatchCost * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 1000) / 1000,
      createdAt: now,
      updatedAt: now,
    };

    store.boms.unshift(newBOM);
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'BILL_OF_MATERIAL',
      entityId: newBOM.id,
      actionType: 'CREATE',
      newValues: newBOM as unknown as Record<string, unknown>,
    });
    return newBOM;
  }

  static async updateBOM(id: string, data: Partial<BillOfMaterialDTO>, actorUserId?: string): Promise<BillOfMaterialDTO> {
    const index = store.boms.findIndex((b) => b.id === id);
    if (index === -1) throw new NotFoundError(`BOM not found: ${id}`);

    const existing = store.boms[index];
    const updated: BillOfMaterialDTO = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    store.boms[index] = updated;
    await recordSecurityAudit({
      userId: actorUserId,
      entityName: 'BILL_OF_MATERIAL',
      entityId: updated.id,
      actionType: 'UPDATE',
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  static async deactivateBOM(id: string, actorUserId?: string): Promise<BillOfMaterialDTO> {
    return this.updateBOM(id, { status: 'OBSOLETE' }, actorUserId);
  }

  // ==========================================
  // 11. BULK CSV EXPORT GENERATOR
  // ==========================================
  static exportCsv(moduleName: string): string {
    switch (moduleName) {
      case 'customers': {
        const headers = ['Code', 'Business Name', 'Customer Type', 'GSTIN', 'Contact Person', 'Phone', 'Email', 'State', 'Credit Limit', 'Status'];
        const rows = store.customers.map((c) => [
          `"${c.code}"`,
          `"${c.businessName}"`,
          `"${c.customerType}"`,
          `"${c.gstin || ''}"`,
          `"${c.contactPerson}"`,
          `"${c.phone}"`,
          `"${c.email || ''}"`,
          `"${c.state}"`,
          c.creditLimit,
          `"${c.status}"`,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }
      case 'suppliers': {
        const headers = ['Code', 'Supplier Name', 'GSTIN', 'Contact Person', 'Phone', 'Email', 'State', 'Status'];
        const rows = store.suppliers.map((s) => [
          `"${s.code}"`,
          `"${s.name}"`,
          `"${s.gstin || ''}"`,
          `"${s.contactPerson}"`,
          `"${s.phone}"`,
          `"${s.email || ''}"`,
          `"${s.state}"`,
          `"${s.status}"`,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }
      case 'products': {
        const headers = ['SKU / Code', 'Product Name', 'Category', 'Pack Size', 'Selling Price (INR)', 'GST Rate (%)', 'HSN Code', 'Unit', 'Status'];
        const rows = store.products.map((p) => [
          `"${p.code}"`,
          `"${p.name}"`,
          `"${p.categoryName}"`,
          `"${p.packSize}"`,
          p.sellingPrice,
          p.gstRate,
          `"${p.hsnCode}"`,
          `"${p.unitCode}"`,
          `"${p.status}"`,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }
      case 'raw-materials': {
        const headers = ['Code', 'Material Name', 'Unit', 'Default Purchase Rate (INR)', 'Reorder Level', 'Safety Stock', 'Status'];
        const rows = store.rawMaterials.map((r) => [
          `"${r.code}"`,
          `"${r.name}"`,
          `"${r.unitCode}"`,
          r.defaultPurchaseRate,
          r.reorderLevel,
          r.safetyStock,
          `"${r.status}"`,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }
      case 'packaging-materials': {
        const headers = ['Code', 'Material Name', 'Unit', 'Purchase Rate (INR)', 'Reorder Level', 'Safety Stock', 'Status'];
        const rows = store.packagingMaterials.map((p) => [
          `"${p.code}"`,
          `"${p.name}"`,
          `"${p.unitCode}"`,
          p.purchaseRate,
          p.reorderLevel,
          p.safetyStock,
          `"${p.status}"`,
        ]);
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }
      default:
        throw new NotFoundError(`Export not supported for module: ${moduleName}`);
    }
  }
}
