/**
 * Master Data Management Types
 * Order-to-Audit Manufacturing ERP
 */

export type Status = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerType = 'RETAILER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'INSTITUTIONAL';
export type UnitType = 'WEIGHT' | 'VOLUME' | 'COUNT';
export type BOMStatus = 'DRAFT' | 'ACTIVE' | 'OBSOLETE';
export type ItemType = 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';

export interface CustomerDTO {
  id: string;
  code: string;
  businessName: string;
  customerType: CustomerType;
  gstin?: string;
  pan?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  billingAddress: string;
  shippingAddress: string;
  state: string;
  stateCode: string;
  creditLimit: number;
  creditDays: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDTO {
  id: string;
  code: string;
  name: string;
  gstin?: string;
  pan?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  state: string;
  stateCode?: string;
  paymentTerms?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryDTO {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  parentName?: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface UnitDTO {
  id: string;
  code: string;
  name: string;
  symbol: string;
  unitType: UnitType;
  isBaseUnit: boolean;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversionDTO {
  id: string;
  fromUnitId: string;
  fromUnitCode: string;
  toUnitId: string;
  toUnitCode: string;
  multiplier: number; // e.g. 1 KG = 1000 G -> multiplier = 1000
  productId?: string | null;
  productName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDTO {
  id: string;
  code: string; // SKU
  name: string;
  categoryId: string;
  categoryName: string;
  packSize: string; // e.g. "200 g"
  sellingPrice: number;
  gstRate: number; // e.g. 12 (%)
  hsnCode: string; // e.g. "19059040"
  unitId: string;
  unitCode: string;
  description?: string;
  minOrderQty: number;
  safetyStock: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface RawMaterialDTO {
  id: string;
  code: string;
  name: string;
  unitId: string;
  unitCode: string;
  description?: string;
  hsnCode?: string;
  reorderLevel: number;
  defaultPurchaseRate: number;
  safetyStock: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface PackagingMaterialDTO {
  id: string;
  code: string;
  name: string;
  unitId: string;
  unitCode: string;
  description?: string;
  hsnCode?: string;
  purchaseRate: number;
  reorderLevel: number;
  safetyStock: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface SellingPriceDTO {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  customerType?: CustomerType | 'ALL';
  tierName: string; // e.g. "Distributor Tier", "Retailer Standard", "MRP"
  price: number;
  minQty: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface BOMItemDTO {
  id: string;
  itemType: ItemType;
  materialId: string; // ID of RawMaterial or PackagingMaterial
  materialCode: string;
  materialName: string;
  standardQty: number;
  scrapPercentage: number;
  unitId: string;
  unitCode: string;
  unitCost: number;
  lineCost: number;
}

export interface BillOfMaterialDTO {
  id: string;
  bomNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  version: string; // e.g. "V1.0"
  batchSize: number; // e.g. 100 kg
  unitId: string;
  unitCode: string;
  status: BOMStatus;
  effectiveDate: string;
  approvedBy?: string | null;
  items: BOMItemDTO[];
  totalRawMaterialCost: number;
  totalPackagingCost: number;
  totalBatchCost: number;
  costPerUnit: number; // totalBatchCost / batchSize
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
