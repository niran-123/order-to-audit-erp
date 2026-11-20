import api from './api';

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const masterDataService = {
  // Customers
  getCustomers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/customers', { params }).then((res) => res.data.data),

  createCustomer: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/customers', data).then((res) => res.data.data),

  updateCustomer: (id: string, data: any) =>
    api.put<SingleResponse<any>>(`/master-data/customers/${id}`, data).then((res) => res.data.data),

  deactivateCustomer: (id: string) =>
    api.patch<SingleResponse<any>>(`/master-data/customers/${id}/deactivate`).then((res) => res.data.data),

  // Suppliers
  getSuppliers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/suppliers', { params }).then((res) => res.data.data),

  createSupplier: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/suppliers', data).then((res) => res.data.data),

  updateSupplier: (id: string, data: any) =>
    api.put<SingleResponse<any>>(`/master-data/suppliers/${id}`, data).then((res) => res.data.data),

  deactivateSupplier: (id: string) =>
    api.patch<SingleResponse<any>>(`/master-data/suppliers/${id}/deactivate`).then((res) => res.data.data),

  // Categories
  getCategories: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/categories', { params }).then((res) => res.data.data),

  createCategory: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/categories', data).then((res) => res.data.data),

  // Units & Conversions
  getUnits: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<any>>('/master-data/units', { params }).then((res) => res.data.data),

  createUnit: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/units', data).then((res) => res.data.data),

  getConversions: () =>
    api.get<SingleResponse<any[]>>('/master-data/conversions').then((res) => res.data.data),

  createConversion: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/conversions', data).then((res) => res.data.data),

  convertUnits: (qty: number, fromUnit: string, toUnit: string, productId?: string) =>
    api.get<SingleResponse<any>>('/master-data/conversions/convert', { params: { qty, fromUnit, toUnit, productId } }).then((res) => res.data.data),

  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/products', { params }).then((res) => res.data.data),

  createProduct: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/products', data).then((res) => res.data.data),

  updateProduct: (id: string, data: any) =>
    api.put<SingleResponse<any>>(`/master-data/products/${id}`, data).then((res) => res.data.data),

  deactivateProduct: (id: string) =>
    api.patch<SingleResponse<any>>(`/master-data/products/${id}/deactivate`).then((res) => res.data.data),

  // Raw Materials
  getRawMaterials: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/raw-materials', { params }).then((res) => res.data.data),

  createRawMaterial: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/raw-materials', data).then((res) => res.data.data),

  updateRawMaterial: (id: string, data: any) =>
    api.put<SingleResponse<any>>(`/master-data/raw-materials/${id}`, data).then((res) => res.data.data),

  deactivateRawMaterial: (id: string) =>
    api.patch<SingleResponse<any>>(`/master-data/raw-materials/${id}/deactivate`).then((res) => res.data.data),

  // Packaging Materials
  getPackagingMaterials: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/packaging-materials', { params }).then((res) => res.data.data),

  createPackagingMaterial: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/packaging-materials', data).then((res) => res.data.data),

  updatePackagingMaterial: (id: string, data: any) =>
    api.put<SingleResponse<any>>(`/master-data/packaging-materials/${id}`, data).then((res) => res.data.data),

  deactivatePackagingMaterial: (id: string) =>
    api.patch<SingleResponse<any>>(`/master-data/packaging-materials/${id}/deactivate`).then((res) => res.data.data),

  // Selling Prices
  getSellingPrices: (productId?: string) =>
    api.get<SingleResponse<any[]>>('/master-data/pricing', { params: { productId } }).then((res) => res.data.data),

  createSellingPrice: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/pricing', data).then((res) => res.data.data),

  // BOMs
  getBOMs: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<any>>('/master-data/boms', { params }).then((res) => res.data.data),

  getBOMById: (id: string) =>
    api.get<SingleResponse<any>>(`/master-data/boms/${id}`).then((res) => res.data.data),

  createBOM: (data: any) =>
    api.post<SingleResponse<any>>('/master-data/boms', data).then((res) => res.data.data),

  deactivateBOM: (id: string) =>
    api.patch<SingleResponse<any>>(`/master-data/boms/${id}/deactivate`).then((res) => res.data.data),

  // CSV Export
  downloadCsv: async (moduleName: string) => {
    const res = await api.get(`/master-data/export/${moduleName}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${moduleName}-export.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
};
