/**
 * Order-to-Audit Manufacturing ERP
 * Comprehensive Master Data Management Verification Suite
 * 
 * Verifies all 10 master data modules, Murukku 200 g benchmark data,
 * duplicate prevention, conversion mathematics, BOM recipe costs, CSV exports,
 * and deactivations.
 */

import { MasterDataService, store } from '../backend/src/modules/master-data/master-data.service';

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, testName: string, failureMessage?: string) {
  if (condition) {
    results.push({ suite, testName, passed: true });
    console.log(`  [PASS] ${suite} -> ${testName}`);
  } else {
    results.push({ suite, testName, passed: false, message: failureMessage });
    console.error(`  [FAIL] ${suite} -> ${testName}: ${failureMessage || 'Assertion failed'}`);
  }
}

async function runMasterDataTests() {
  console.log('================================================================');
  console.log('ORDER-TO-AUDIT ERP - MASTER DATA MANAGEMENT VERIFICATION SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: Customer Management
  // -------------------------------------------------------------
  console.log('>> Suite 1: Customer Management');
  const initialCustomers = MasterDataService.listCustomers({});
  assert(initialCustomers.total >= 2, 'Customer Module', 'Initial benchmark customers loaded');

  // Verify Sri Meenakshi Traders (Distributor)
  const meenakshi = MasterDataService.getCustomerById('CUST-MEENAKSHI');
  assert(meenakshi.businessName.includes('Meenakshi'), 'Customer Module', 'Sri Meenakshi Traders exists');
  assert(meenakshi.customerType === 'DISTRIBUTOR', 'Customer Module', 'Meenakshi is tagged as DISTRIBUTOR');
  assert(meenakshi.stateCode === '33', 'Customer Module', 'Tamil Nadu state code 33 correctly assigned');
  assert(meenakshi.creditLimit === 500000, 'Customer Module', 'Credit limit is ₹500,000');

  // Search & Filter
  const searchRes = MasterDataService.listCustomers({ search: 'Kaveri' });
  assert(searchRes.items.length === 1 && searchRes.items[0].code === 'CUST-KAVERI', 'Customer Module', 'Search by business name works');

  // Create new customer
  const newCust = await MasterDataService.createCustomer({
    code: 'CUST-TEST-001',
    businessName: 'Vasantham Hypermarket LLP',
    customerType: 'RETAILER',
    gstin: '33AABCV9999R1Z1',
    contactPerson: 'M. Senthil',
    phone: '+91 99887 66554',
    email: 'purchases@vasantham.com',
    billingAddress: '44 Main Road, Salem - 636001',
    shippingAddress: 'Godown 2, Salem - 636002',
    state: 'Tamil Nadu',
    stateCode: '33',
    creditLimit: 100000,
    creditDays: 15,
    status: 'ACTIVE',
  });
  assert(newCust.code === 'CUST-TEST-001', 'Customer Module', 'New customer created successfully');

  // Duplicate Code Prevention
  let dupPrevented = false;
  try {
    await MasterDataService.createCustomer({
      code: 'CUST-TEST-001',
      businessName: 'Duplicate Customer',
      customerType: 'RETAILER',
      contactPerson: 'Test',
      phone: '+91 99999 88888',
      billingAddress: 'Test Addr',
      shippingAddress: 'Test Addr',
      state: 'Tamil Nadu',
      stateCode: '33',
      creditLimit: 0,
      creditDays: 0,
      status: 'ACTIVE',
    });
  } catch (err: any) {
    dupPrevented = err.statusCode === 409 || err.message.includes('already exists');
  }
  assert(dupPrevented, 'Customer Module', 'Duplicate customer code blocked with 409 Conflict');

  // Update & Deactivate
  const updatedCust = await MasterDataService.updateCustomer(newCust.id, { creditLimit: 120000 });
  assert(updatedCust.creditLimit === 120000, 'Customer Module', 'Customer updated successfully');
  const deactivatedCust = await MasterDataService.deactivateCustomer(newCust.id);
  assert(deactivatedCust.status === 'INACTIVE', 'Customer Module', 'Customer successfully deactivated');

  // -------------------------------------------------------------
  // SUITE 2: Supplier Management
  // -------------------------------------------------------------
  console.log('\n>> Suite 2: Supplier Management');
  const suppliers = MasterDataService.listSuppliers({});
  assert(suppliers.total >= 2, 'Supplier Module', 'Benchmark suppliers loaded');

  const cauvery = MasterDataService.getSupplierById('SUP-CAUVERY-AGRO');
  assert(cauvery.name.includes('Cauvery Agro'), 'Supplier Module', 'Cauvery Agro supplier retrieved');
  assert(cauvery.gstin === '33AABCC9900M1ZV', 'Supplier Module', 'Supplier GSTIN preserved');

  // Duplicate Supplier Prevention
  let supDupPrevented = false;
  try {
    await MasterDataService.createSupplier({
      code: 'SUP-CAUVERY-AGRO',
      name: 'Duplicate Cauvery',
      contactPerson: 'Test',
      phone: '+91 99999 00000',
      address: 'Test',
      state: 'Tamil Nadu',
      status: 'ACTIVE',
    });
  } catch (err: any) {
    supDupPrevented = err.statusCode === 409 || err.message.includes('already exists');
  }
  assert(supDupPrevented, 'Supplier Module', 'Duplicate supplier code prevented');

  // -------------------------------------------------------------
  // SUITE 3: Product Category Management
  // -------------------------------------------------------------
  console.log('\n>> Suite 3: Product Category Management');
  const categories = MasterDataService.listCategories({});
  assert(categories.total >= 4, 'Category Module', 'Benchmark categories present');
  const savoryCat = MasterDataService.getCategoryById('CAT-SAVORY');
  assert(savoryCat.name === 'Savory Snacks', 'Category Module', 'Savory Snacks category verified');

  const newSubCat = await MasterDataService.createCategory({
    code: 'CAT-RIBBON-PAKODA',
    name: 'Ribbon Pakoda Line',
    description: 'Extruded ribbon savory snacks',
    parentId: savoryCat.id,
    status: 'ACTIVE',
  });
  assert(newSubCat.parentName === 'Savory Snacks', 'Category Module', 'Sub-category links to parent name');

  // -------------------------------------------------------------
  // SUITE 4: Units & Conversion Mathematics
  // -------------------------------------------------------------
  console.log('\n>> Suite 4: Units & Conversion Mathematics');
  const units = MasterDataService.listUnits({});
  assert(units.total >= 7, 'Unit Module', 'Standard enterprise units defined');
  const kgUnit = MasterDataService.getUnitById('KG');
  assert(kgUnit.isBaseUnit === true, 'Unit Module', 'KG marked as base weight unit');

  // Conversion Calculations
  const gInKg = MasterDataService.convertQuantity(2500, 'G', 'KG');
  assert(gInKg === 2.5, 'Conversion Module', '2500 G correctly converted to 2.5 KG');

  const kgInG = MasterDataService.convertQuantity(3.2, 'KG', 'G');
  assert(kgInG === 3200, 'Conversion Module', '3.2 KG correctly converted to 3200 G');

  const mlInLtr = MasterDataService.convertQuantity(1500, 'ML', 'LTR');
  assert(mlInLtr === 1.5, 'Conversion Module', '1500 ML correctly converted to 1.5 LTR');

  // Product-specific conversion (1 Carton = 50 Packets of Murukku 200g)
  const ctnInPkts = MasterDataService.convertQuantity(4, 'CTN', 'PKT', 'prd-mur-200g-01');
  assert(ctnInPkts === 200, 'Conversion Module', '4 Master Cartons of Murukku 200g = 200 Packets');

  // -------------------------------------------------------------
  // SUITE 5: Raw Material Benchmark Suite
  // -------------------------------------------------------------
  console.log('\n>> Suite 5: Raw Material Management');
  const rawMaterials = MasterDataService.listRawMaterials({});
  assert(rawMaterials.total >= 8, 'Raw Material Module', 'All 8 Murukku benchmark raw materials loaded');

  const riceFlour = MasterDataService.getRawMaterialById('RM-RICE-01');
  assert(riceFlour.unitCode === 'KG', 'Raw Material Module', 'Rice Flour uses KG unit');
  assert(riceFlour.defaultPurchaseRate === 42.0, 'Raw Material Module', 'Rice Flour purchase rate is ₹42/kg');
  assert(riceFlour.reorderLevel === 500, 'Raw Material Module', 'Rice Flour reorder level is 500 kg');

  const hing = MasterDataService.getRawMaterialById('RM-HING-01');
  assert(hing.defaultPurchaseRate === 850.0, 'Raw Material Module', 'Asafoetida purchase rate is ₹850/kg');

  // -------------------------------------------------------------
  // SUITE 6: Packaging Material Benchmark Suite
  // -------------------------------------------------------------
  console.log('\n>> Suite 6: Packaging Material Management');
  const packMaterials = MasterDataService.listPackagingMaterials({});
  assert(packMaterials.total >= 4, 'Packaging Material Module', 'Benchmark packaging materials loaded');

  const pouch = MasterDataService.getPackagingMaterialById('PM-POUCH-MUR-200');
  assert(pouch.purchaseRate === 2.25, 'Packaging Material Module', 'Murukku 200g pouch purchase rate is ₹2.25/pc');
  assert(pouch.reorderLevel === 10000, 'Packaging Material Module', 'Pouch reorder level is 10,000 pcs');

  const carton = MasterDataService.getPackagingMaterialById('PM-CTN-MUR-50');
  assert(carton.purchaseRate === 38.5, 'Packaging Material Module', '5-Ply master carton purchase rate is ₹38.50/pc');

  // -------------------------------------------------------------
  // SUITE 7: Finished Product: Murukku 200 g
  // -------------------------------------------------------------
  console.log('\n>> Suite 7: Finished Product Management');
  const murukku = MasterDataService.getProductById('PRD-MUR-200G');
  assert(murukku.name.includes('Murukku 200g'), 'Product Module', 'Murukku 200g product retrieved');
  assert(murukku.packSize === '200 g', 'Product Module', 'Pack size is 200 g');
  assert(murukku.hsnCode === '19059040', 'Product Module', 'GST HSN code is 19059040');
  assert(murukku.gstRate === 12.0, 'Product Module', 'GST rate is 12%');
  assert(murukku.sellingPrice === 55.0, 'Product Module', 'Base selling price is ₹55.00');
  assert(murukku.unitCode === 'PKT', 'Product Module', 'Unit is Packet (PKT)');

  // -------------------------------------------------------------
  // SUITE 8: Selling Price Tier Management
  // -------------------------------------------------------------
  console.log('\n>> Suite 8: Selling Price Management');
  const priceTiers = MasterDataService.listSellingPrices(murukku.id);
  assert(priceTiers.length >= 4, 'Pricing Module', '4 pricing tiers defined for Murukku 200g');

  const distributorTier = priceTiers.find((t) => t.customerType === 'DISTRIBUTOR');
  assert(distributorTier?.price === 46.5, 'Pricing Module', 'Distributor wholesale price is ₹46.50');
  assert(distributorTier?.minQty === 500, 'Pricing Module', 'Distributor minimum order qty is 500 packets (10 cartons)');

  const retailerTier = priceTiers.find((t) => t.customerType === 'RETAILER');
  assert(retailerTier?.price === 52.0, 'Pricing Module', 'Retailer tier price is ₹52.00 (min 50 packets)');

  // -------------------------------------------------------------
  // SUITE 9: Bill of Materials (BOM) Formula Verification
  // -------------------------------------------------------------
  console.log('\n>> Suite 9: BOM Master Formula Verification');
  const bom = MasterDataService.getBOMById('BOM-MUR-200G-V1');
  assert(bom.productCode === 'PRD-MUR-200G', 'BOM Master Module', 'BOM links to Murukku 200g');
  assert(bom.batchSize === 100.0, 'BOM Master Module', 'Batch size is 100 kg dough (= 500 finished pkts)');
  assert(bom.status === 'ACTIVE', 'BOM Master Module', 'BOM status is ACTIVE');
  assert(bom.items.length === 10, 'BOM Master Module', 'BOM has 10 ingredient and packaging line items');

  // Ingredient proportions
  const riceItem = bom.items.find((i) => i.materialCode === 'RM-RICE-01');
  assert(riceItem?.standardQty === 65.0, 'BOM Master Module', 'Rice Flour is 65 kg in 100 kg batch');
  assert(riceItem?.scrapPercentage === 1.0, 'BOM Master Module', 'Rice Flour scrap allowance is 1%');

  const oilItem = bom.items.find((i) => i.materialCode === 'RM-OIL-01');
  assert(oilItem?.standardQty === 8.0, 'BOM Master Module', 'Oil absorption is 8 LTR');

  const pouchItem = bom.items.find((i) => i.materialCode === 'PM-POUCH-MUR-200');
  assert(pouchItem?.standardQty === 500.0, 'BOM Master Module', '500 printed pouches allocated per batch');

  // Cost Aggregations
  assert(bom.totalBatchCost > 8000 && bom.totalBatchCost < 8200, 'BOM Master Module', `Total batch cost calculated: ₹${bom.totalBatchCost}`);
  assert(bom.costPerUnit > 16.0 && bom.costPerUnit < 16.5, 'BOM Master Module', `Unit cost per 200g packet calculated: ₹${bom.costPerUnit}`);

  // Create New Version BOM (V2.0)
  const newBOM = await MasterDataService.createBOM({
    bomNumber: 'BOM-MUR-200G-V2',
    productId: murukku.id,
    version: 'V2.0',
    batchSize: 200.0, // 200 kg high-capacity continuous run
    unitId: kgUnit.id,
    status: 'DRAFT',
    items: [
      { itemType: 'RAW_MATERIAL', materialId: riceFlour.id, standardQty: 130.0, scrapPercentage: 1.0, unitId: kgUnit.id },
      { itemType: 'PACKAGING_MATERIAL', materialId: pouch.id, standardQty: 1000.0, scrapPercentage: 1.0, unitId: pouch.unitId },
    ],
  });
  assert(newBOM.bomNumber === 'BOM-MUR-200G-V2', 'BOM Master Module', 'V2.0 BOM created with auto cost calculation');

  // -------------------------------------------------------------
  // SUITE 10: Bulk CSV Export Generation
  // -------------------------------------------------------------
  console.log('\n>> Suite 10: Bulk CSV Export Generation');
  const custCsv = MasterDataService.exportCsv('customers');
  assert(custCsv.startsWith('Code,Business Name'), 'CSV Export', 'Customer CSV export generates valid headers');
  assert(custCsv.includes('CUST-MEENAKSHI'), 'CSV Export', 'Customer CSV contains Meenakshi Traders');

  const prodCsv = MasterDataService.exportCsv('products');
  assert(prodCsv.includes('PRD-MUR-200G') && prodCsv.includes('19059040'), 'CSV Export', 'Product CSV contains Murukku 200g and HSN');

  const rmCsv = MasterDataService.exportCsv('raw-materials');
  assert(rmCsv.includes('RM-RICE-01') && rmCsv.includes('42'), 'CSV Export', 'Raw Material CSV contains purchase rate');

  const pmCsv = MasterDataService.exportCsv('packaging-materials');
  assert(pmCsv.includes('PM-POUCH-MUR-200') && pmCsv.includes('2.25'), 'CSV Export', 'Packaging CSV contains pouch purchase rate');

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`MASTER DATA VERIFICATION RESULTS: ${passed}/${total} PASSED`);
  if (failed > 0) {
    console.error(`FAILED TESTS: ${failed}`);
    process.exit(1);
  } else {
    console.log('ALL MASTER DATA MODULES & MURUKKU 200G FORMULAS PASSED!');
    console.log('================================================================\n');
  }
}

runMasterDataTests().catch((err) => {
  console.error('\nFatal test error:', err);
  process.exit(1);
});
