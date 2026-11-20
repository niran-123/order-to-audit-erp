/**
 * Sales, GST Invoicing & Dispatch Benchmark Data
 * Order-to-Audit Manufacturing ERP
 */

export const ENTERPRISE_SELLER_INFO = {
  name: 'Order-to-Audit Foods Manufacturing LLP',
  address: 'Plot 14-B, SIPCOT Industrial Estate, Thanjavur, Tamil Nadu - 613005',
  gstin: '33AAAAO2026A1Z5',
  state: 'Tamil Nadu',
  stateCode: '33',
  phone: '+91 4362 255678',
  email: 'billing@ordertoaudit.com',
};

export const BENCHMARK_CUSTOMERS = [
  {
    id: 'cust-retailer-a',
    code: 'CUST-RETAILER-A',
    businessName: 'Annapoorna Retail Stores (Retailer A)',
    customerType: 'RETAILER' as const,
    gstin: '33AABCA4432P1ZQ',
    state: 'Tamil Nadu',
    stateCode: '33',
    billingAddress: '14, Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012',
    shippingAddress: '14, Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012',
    phone: '+91 94441 55678',
    email: 'accounts@annapoornasweets.in',
  },
  {
    id: 'cust-distributor-b',
    code: 'CUST-DISTRIBUTOR-B',
    businessName: 'Kaveri Fresh Supermarkets LLP (Distributor B)',
    customerType: 'DISTRIBUTOR' as const,
    gstin: '29AABCK5678Q1Z2',
    state: 'Karnataka',
    stateCode: '29',
    billingAddress: '102, 100ft Road, Indiranagar, Bengaluru, Karnataka - 560038',
    shippingAddress: 'Central DC, Hosur Road, Electronic City, Bengaluru, Karnataka - 560100',
    phone: '+91 98860 78901',
    email: 'procurement@kaverifresh.com',
  },
];
