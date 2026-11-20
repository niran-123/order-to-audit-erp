/**
 * Business Intelligence, Reporting & Audit Integration Test Suite
 * Order-to-Audit Manufacturing ERP
 *
 * Verifies:
 * 1. Benchmark transaction lifecycle execution:
 *    - PO & GRN for Flour and Tirupati Oils
 *    - Production Run: 188 good pkts, ₹5,947.00 total cost, ₹31.6330 unit cost
 *    - Intra-state Retailer A: 150 pkts, invoice ₹7,875.00, dispatch 150 pkts
 *    - Partial Payment: ₹4,000.00 received, outstanding ₹3,875.00
 *    - Inter-state Distributor B: 20 pkts @ ₹46.50 = ₹930.00 + 5% IGST ₹46.50 = ₹976.50
 * 2. 17 Distinct Reports mathematically reconciling with underlying transaction records:
 *    - Sales Register (Grand total ₹8,851.50 == sum of invoices)
 *    - Customer-wise Sales (Retailer A ₹7,875.00, Distributor B ₹976.50)
 *    - Product-wise Sales (170 pkts sold, ₹8,851.50 revenue)
 *    - GST Outward Supplies (Intra ₹7,500 + Inter ₹930 = ₹8,430 taxable)
 *    - Purchase Register (Tirupati Oils & Flour POs, GRN status: RECEIVED)
 *    - Raw Material Stock Summary (Rice Flour, Oil, Spices closing balances & valuation)
 *    - Packaging Stock Summary (Pouches & Cartons valuation)
 *    - Finished Goods Stock Summary (closing and available stock)
 *    - Complete Stock Ledger (Perpetual movement log)
 *    - Production Report (200 planned, 188 actual good, 12 damaged)
 *    - Planned vs Actual Consumption Report (+5% Oil variance alert)
 *    - Production Yield Report (94.00% yield, -6.00% variance alert)
 *    - Wastage Report (12 damaged packets, 6 scrap pouches)
 *    - Cost Per Packet Report (₹31.6330 per good packet)
 *    - Payments and Collections Report (₹4,000 collected)
 *    - Customer Outstanding Report (Net outstanding ₹4,851.50)
 *    - Receivables Ageing Report (0-30 days bracket)
 * 3. Immutable Audit Trail capturing all events
 * 4. Executive Dashboards: Owner, Admin, Production
 * 5. Universal CSV Export serialization
 */

import { ReportsService } from '../backend/src/modules/reports/reports.service';
import { SalesService, salesStore } from '../backend/src/modules/sales/sales.service';
import { InventoryService } from '../backend/src/modules/inventory/inventory.service';
import { PurchasesService } from '../backend/src/modules/inventory/purchases.service';
import { ProductionService } from '../backend/src/modules/production/production.service';
import { FinanceService, financeStore } from '../backend/src/modules/finance/finance.service';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ ${testName}`);
    if (failureDetail) {
      console.error(`    Detail: ${failureDetail}`);
    }
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('BUSINESS INTELLIGENCE & AUDIT REPORTING TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // STEP 0: Reset Stores & Setup Benchmark Transactions
  // -------------------------------------------------------------------------
  console.log('--- STEP 0: Setting Up Comprehensive Benchmark Data ---');
  InventoryService.resetBenchmark();
  PurchasesService.resetBenchmark();
  ProductionService.resetBenchmark();
  SalesService.resetBenchmark();
  FinanceService.resetBenchmark();

  // Benchmark inventory setup
  const flourState = InventoryService.getItemById('inv-rm-rice-01');
  flourState.openingBalance = 100.0;
  flourState.currentStock = 100.0;
  flourState.averageCost = 42.0;

  const oilState = InventoryService.getItemById('inv-rm-oil-01');
  oilState.openingBalance = 50.0;
  oilState.currentStock = 50.0;
  oilState.averageCost = 125.0;

  const spiceState = InventoryService.getItemById('inv-rm-spice-01');
  spiceState.openingBalance = 20.0;
  spiceState.currentStock = 20.0;
  spiceState.averageCost = 240.0;

  const pouchState = InventoryService.getItemById('inv-pm-pouch-01');
  pouchState.openingBalance = 500.0;
  pouchState.currentStock = 500.0;
  pouchState.averageCost = 2.25;

  const ctnState = InventoryService.getItemById('inv-pm-ctn-01');
  ctnState.openingBalance = 31.0;
  ctnState.currentStock = 31.0;
  ctnState.averageCost = 38.5;

  const fgState = InventoryService.getItemById('inv-fg-mur-200g');
  fgState.openingBalance = 50.0;
  fgState.currentStock = 50.0;
  fgState.averageCost = 31.633;

  // 1. Flour Purchase to achieve WAC = 43.125
  const flourPO = await PurchasesService.createPurchase({
    supplierId: 'sup-cauvery-01',
    items: [
      {
        itemType: 'RAW_MATERIAL',
        materialId: 'inv-rm-rice-01',
        orderedQty: 60.0,
        unitPrice: 45.0,
        taxRate: 5.0,
      },
    ],
    createdBy: 'usr-admin-01',
  });

  await PurchasesService.confirmPurchase({
    purchaseId: flourPO.id,
    supplierInvoiceNumber: 'CAUV/2026/7821',
    confirmedBy: 'usr-supervisor-01',
  });

  // 2. Production Run: Murukku 200g (Batch size 200, actual good 188 pkts)
  const murukkuBOM = ProductionService.getBOMById('bom-mur-200g-v1');
  const run = await ProductionService.createProductionRun({
    productId: murukkuBOM.productId,
    bomId: murukkuBOM.id,
    plannedOutput: 200,
    supervisorId: 'usr-supervisor-01',
    notes: 'BI Benchmark Shift',
  });

  await ProductionService.completeAndPostProductionRun(run.id, {
    actualGoodOutput: 188.0,
    damagedOutput: 12.0,
    damagedPackagingQty: 6.0,
    materials: [
      { materialId: 'inv-rm-rice-01', actualQty: 40.0 }, // 40 kg flour
      { materialId: 'inv-rm-oil-01', actualQty: 10.5 }, // 10.5 L oil (+5% variance)
      { materialId: 'inv-rm-spice-01', actualQty: 1.2 }, // 1.2 kg spices
      { materialId: 'inv-pm-pouch-01', actualQty: 194.0 }, // 188 good + 6 damaged = 194 pouches
      { materialId: 'inv-pm-ctn-01', actualQty: 10.0 }, // 10 cartons
    ],
    overheads: {
      labourCost: 1200.0,
      gasCost: 380.0,
      electricityCost: 220.0,
    },
    supervisorId: 'usr-supervisor-01',
  });

  const salesman1 = { userId: 'sales-001', name: 'Ravi Kumar', email: 'ravi@enterprise.com' };
  const adminUser = { userId: 'admin-001', name: 'Admin', email: 'admin@enterprise.com' };
  const accountantUser = { userId: 'acc-001', name: 'Accountant', email: 'accountant@enterprise.com' };

  // 3. Sales Order 1: Retailer A (Intra-state, 150 pkts @ ₹50.00 = ₹7,875.00)
  const orderA = await SalesService.createOrder(
    {
      customerId: 'cust-retailer-a',
      expectedDeliveryDate: '2026-11-25',
      paymentTerms: 'NET_15',
      items: [{ productId: 'inv-fg-mur-200g', orderedQty: 150 }],
    },
    salesman1
  );

  await SalesService.approveOrder(orderA.id, adminUser);
  const invoiceA = await SalesService.generateInvoice(orderA.id, accountantUser);

  await SalesService.createDispatch(
    orderA.id,
    {
      carrierName: 'VRL Logistics Ltd',
      vehicleNumber: 'TN-45-AZ-9988',
      trackingNumber: 'VRL-TN-88291',
      items: [
        {
          salesOrderItemId: orderA.items[0].id,
          productId: 'inv-fg-mur-200g',
          dispatchedQty: 150,
        },
      ],
    },
    { userId: 'usr-supervisor-01', email: 'supervisor@enterprise.com' }
  );

  // 4. Payment 1: Retailer A pays ₹4,000.00 allocated to Invoice A
  await FinanceService.recordPayment(
    {
      customerId: 'cust-retailer-a',
      invoiceId: invoiceA.id,
      amount: 4000.0,
      paymentMethod: 'NEFT',
      referenceNumber: 'NEFT-HDFC-991244',
      bankName: 'HDFC Bank Ltd',
    },
    { userId: 'acc-001', email: 'accountant@enterprise.com', roles: ['ACCOUNTANT' as any] }
  );

  // 5. Sales Order 2: Distributor B (Inter-state, 20 pkts @ ₹46.50 = ₹930.00 + 5% IGST ₹46.50 = ₹976.50)
  const orderB = await SalesService.createOrder(
    {
      customerId: 'cust-distributor-b',
      expectedDeliveryDate: '2026-11-28',
      paymentTerms: 'NET_30',
      items: [{ productId: 'inv-fg-mur-200g', orderedQty: 20 }],
    },
    salesman1
  );

  await SalesService.approveOrder(orderB.id, adminUser);
  const invoiceB = await SalesService.generateInvoice(orderB.id, accountantUser);

  assert(salesStore.invoices.size === 2, 'Two benchmark invoices generated');
  assert(financeStore.payments.size === 1, 'One benchmark payment recorded');

  // -------------------------------------------------------------------------
  // STEP 1: REPORT 1 - SALES REGISTER
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Sales Register Report ---');
  const salesRegister = ReportsService.getSalesRegister();
  assert(salesRegister.rows.length === 2, 'Sales register contains 2 invoices');
  assert(salesRegister.summary.totalInvoices === 2, 'Summary count = 2');
  assert(salesRegister.summary.totalTaxableAmount === 8430.0, 'Taxable amount = ₹8,430.00 (₹7,500 + ₹930)');
  assert(salesRegister.summary.totalCGST === 187.5, 'CGST = ₹187.50');
  assert(salesRegister.summary.totalSGST === 187.5, 'SGST = ₹187.50');
  assert(salesRegister.summary.totalIGST === 46.5, 'IGST = ₹46.50');
  assert(salesRegister.summary.totalTax === 421.5, 'Total Tax = ₹421.50 (₹187.50 + ₹187.50 + ₹46.50)');
  assert(salesRegister.summary.grandTotal === 8851.5, 'Grand Total = ₹8,851.50 (₹7,875.00 + ₹976.50)');

  // -------------------------------------------------------------------------
  // STEP 2: REPORT 2 - CUSTOMER-WISE SALES
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Customer-wise Sales Report ---');
  const customerSales = ReportsService.getCustomerSalesReport();
  const retARow = customerSales.rows.find((r) => r.customerName.includes('Murugan') || r.customerCode === 'cust-retailer-a');
  const distBRow = customerSales.rows.find((r) => r.customerName.includes('Krishna') || r.customerCode === 'cust-distributor-b');
  assert(retARow !== undefined, 'Retailer A present in customer sales');
  assert(retARow?.totalInvoicedAmount === 7875.0, 'Retailer A total invoiced = ₹7,875.00');
  assert(distBRow !== undefined, 'Distributor B present in customer sales');
  assert(distBRow?.totalInvoicedAmount === 976.5, 'Distributor B total invoiced = ₹976.50');
  assert(customerSales.summary.totalInvoicedAmount === 8851.5, 'Customer sales summary total = ₹8,851.50');

  // -------------------------------------------------------------------------
  // STEP 3: REPORT 3 - PRODUCT-WISE SALES
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Product-wise Sales Report ---');
  const productSales = ReportsService.getProductSalesReport();
  assert(productSales.rows.length === 1, 'Product sales lists 1 product');
  assert(productSales.rows[0].quantitySold === 170, 'Quantity sold = 170 pkts (150 + 20)');
  assert(productSales.rows[0].totalRevenue === 8851.5, 'Product revenue = ₹8,851.50');
  assert(productSales.rows[0].taxableAmount === 8430.0, 'Product taxable amount = ₹8,430.00');

  // -------------------------------------------------------------------------
  // STEP 4: REPORT 4 - GST OUTWARD SUPPLIES SUMMARY (GSTR-1)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. GST Outward Supplies Summary (GSTR-1) ---');
  const gstOutward = ReportsService.getGSTOutwardSupplies();
  assert(gstOutward.intraState.taxableValue === 7500.0, 'Intra-state taxable = ₹7,500.00');
  assert(gstOutward.intraState.cgstAmount === 187.5, 'Intra-state CGST = ₹187.50');
  assert(gstOutward.intraState.sgstAmount === 187.5, 'Intra-state SGST = ₹187.50');
  assert(gstOutward.intraState.totalTax === 375.0, 'Intra-state Total Tax = ₹375.00');
  assert(gstOutward.interState.taxableValue === 930.0, 'Inter-state taxable = ₹930.00');
  assert(gstOutward.interState.igstAmount === 46.5, 'Inter-state IGST = ₹46.50');
  assert(gstOutward.grandTotal.totalTax === 421.5, 'Grand Total Tax = ₹421.50');
  assert(gstOutward.grandTotal.totalInvoiceValue === 8851.5, 'Grand Total Invoice Value = ₹8,851.50');

  // -------------------------------------------------------------------------
  // STEP 5: REPORT 5 - PURCHASE REGISTER
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Purchase Register ---');
  const purchaseReg = ReportsService.getPurchaseRegister();
  assert(purchaseReg.rows.length >= 2, 'Purchase register has benchmark POs');
  assert(purchaseReg.summary.totalPurchases >= 2, 'Total purchases summary >= 2');
  assert(purchaseReg.summary.grandTotal > 0, 'Grand total purchase amount > 0');

  // -------------------------------------------------------------------------
  // STEP 6: REPORT 6 - RAW MATERIAL STOCK SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Raw Material Stock Summary ---');
  const rmSummary = ReportsService.getMaterialStockSummary('RAW_MATERIAL');
  assert(rmSummary.rows.length >= 3, 'Raw material summary lists all raw materials');
  const flour = rmSummary.rows.find((r) => r.materialCode === 'RM-RICE-01');
  assert(flour !== undefined, 'Rice flour exists');
  assert(flour?.currentStock === 120.0, 'Rice flour current stock = 120 kg (100 opening + 60 purchase - 40 production)');
  assert(flour?.stockStatus === 'CRITICAL', 'Rice flour status is CRITICAL (120 kg < 50% of 500 kg reorder level)');

  // -------------------------------------------------------------------------
  // STEP 7: REPORT 7 - PACKAGING MATERIAL STOCK SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n--- 7. Packaging Material Stock Summary ---');
  const pmSummary = ReportsService.getMaterialStockSummary('PACKAGING_MATERIAL');
  assert(pmSummary.rows.length >= 2, 'Packaging material summary lists pouches and boxes');
  const pouch = pmSummary.rows.find((r) => r.materialCode === 'PM-POUCH-MUR-200');
  assert(pouch !== undefined, 'Pouch PM-POUCH-MUR-200 exists');
  assert(pouch?.currentStock === 306, 'Pouch current stock = 306 (500 opening - 194 issued)');

  // -------------------------------------------------------------------------
  // STEP 8: REPORT 8 - FINISHED GOODS STOCK SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n--- 8. Finished Goods Stock Summary ---');
  const fgSummary = ReportsService.getFinishedGoodsStockSummary();
  assert(fgSummary.rows.length >= 1, 'Finished goods summary contains products');
  const murukku200 = fgSummary.rows.find((r) => r.productCode === 'PRD-MUR-200G');
  assert(murukku200 !== undefined, 'Murukku 200g exists in FG summary');
  assert(murukku200?.currentStock === 88, 'Finished goods closing stock = 88 pkts (50 opening + 188 produced - 150 dispatched)');
  assert(murukku200?.availableStock === 88, 'Finished goods available stock = 88 pkts');

  // -------------------------------------------------------------------------
  // STEP 9: REPORT 9 - COMPLETE STOCK LEDGER
  // -------------------------------------------------------------------------
  console.log('\n--- 9. Complete Stock Ledger ---');
  const stockLedger = ReportsService.getCompleteStockLedger();
  assert(stockLedger.rows.length >= 5, 'Stock ledger contains movements');
  const dispatchMovement = stockLedger.rows.find((r) => r.movementType === 'DISPATCH_OUT');
  assert(dispatchMovement !== undefined, 'DISPATCH_OUT movement recorded in ledger');
  assert(dispatchMovement?.outQuantity === 150, 'Dispatch deducted 150 pkts');

  // -------------------------------------------------------------------------
  // STEP 10: REPORT 10 - PRODUCTION REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- 10. Production Report ---');
  const prodReport = ReportsService.getProductionReport();
  assert(prodReport.rows.length === 1, 'Production report lists 1 completed run');
  assert(prodReport.rows[0].goodPackets === 188, 'Good packets = 188');
  assert(prodReport.rows[0].damagedPackets === 12, 'Damaged packets = 12');
  assert(prodReport.rows[0].scrapPouches === 6, 'Scrap pouches = 6');
  assert(prodReport.rows[0].totalProductionCost === 5947.0, 'Total Production Cost = ₹5,947.00');
  assert(prodReport.rows[0].unitCost === 31.633, 'Unit cost = ₹31.6330 per packet');

  // -------------------------------------------------------------------------
  // STEP 11: REPORT 11 - PLANNED VS ACTUAL CONSUMPTION
  // -------------------------------------------------------------------------
  console.log('\n--- 11. Planned vs Actual Consumption Report ---');
  const consumptionReport = ReportsService.getPlannedVsActualConsumption();
  const oilRow = consumptionReport.rows.find((r) => r.materialCode === 'RM-OIL-01');
  assert(oilRow !== undefined, 'Sunflower oil variance line found');
  assert(oilRow?.plannedQuantity === 10.0, 'Oil planned = 10.0 L');
  assert(oilRow?.actualQuantity === 10.5, 'Oil actual = 10.5 L');
  assert(oilRow?.variancePercentage === 5.0, 'Oil variance % = +5.00%');
  assert(oilRow?.hasAlert === true, 'Oil variance triggered alert (> 3%)');

  // -------------------------------------------------------------------------
  // STEP 12: REPORT 12 - PRODUCTION YIELD REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- 12. Production Yield Report ---');
  const yieldReport = ReportsService.getProductionYieldReport();
  assert(yieldReport.rows.length === 1, 'Yield report lists 1 run');
  assert(yieldReport.rows[0].plannedOutput === 200, 'Planned output = 200');
  assert(yieldReport.rows[0].actualGoodPackets === 188, 'Actual good packets = 188');
  assert(yieldReport.rows[0].yieldPercentage === 94.0, 'Yield percentage = 94.00%');
  assert(yieldReport.rows[0].yieldVariancePercentage === -6.0, 'Yield variance = -6.00%');
  assert(yieldReport.rows[0].hasYieldAlert === true, 'Yield alert flagged');

  // -------------------------------------------------------------------------
  // STEP 13: REPORT 13 - WASTAGE REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- 13. Wastage Report ---');
  const wastageReport = ReportsService.getWastageReport();
  assert(wastageReport.rows.length === 1, 'Wastage report lists 1 run');
  assert(wastageReport.rows[0].damagedFinishedPackets === 12, 'Damaged packets = 12');
  assert(wastageReport.rows[0].damagedPackagingPouches === 6, 'Damaged pouches = 6');
  assert(wastageReport.summary.totalDamagedPackets === 12, 'Summary damaged packets = 12');
  assert(wastageReport.summary.totalPouchesScrapped === 6, 'Summary pouches scrapped = 6');

  // -------------------------------------------------------------------------
  // STEP 14: REPORT 14 - COST PER PACKET REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- 14. Cost Per Packet Report ---');
  const costReport = ReportsService.getCostPerPacketReport();
  assert(costReport.rows.length === 1, 'Cost per packet lists 1 run');
  assert(costReport.rows[0].goodPacketsCount === 188, 'Good packets = 188');
  assert(costReport.rows[0].totalDirectMaterialCost === 4147.0, 'Direct material total = ₹4,147.00');
  assert(costReport.rows[0].totalOverheadsCost === 1800.0, 'Overheads total = ₹1,800.00');
  assert(costReport.rows[0].totalBatchCost === 5947.0, 'Total batch cost = ₹5,947.00');
  assert(costReport.rows[0].finalCostPerGoodPacket === 31.633, 'Final cost per good packet = ₹31.6330');

  // -------------------------------------------------------------------------
  // STEP 15: REPORT 15 - PAYMENTS AND COLLECTIONS
  // -------------------------------------------------------------------------
  console.log('\n--- 15. Payments and Collections Report ---');
  const paymentsReport = ReportsService.getPaymentsCollectionsReport();
  assert(paymentsReport.rows.length === 1, 'Payments report lists 1 payment');
  assert(paymentsReport.rows[0].amountReceived === 4000.0, 'Payment amount received = ₹4,000.00');
  assert(paymentsReport.rows[0].allocatedAmount === 4000.0, 'Allocated amount = ₹4,000.00');
  assert(paymentsReport.rows[0].unallocatedAmount === 0.0, 'Unallocated amount = ₹0.00');
  assert(paymentsReport.rows[0].paymentMethod === 'NEFT', 'Payment method = NEFT');

  // -------------------------------------------------------------------------
  // STEP 16: REPORT 16 - CUSTOMER OUTSTANDING REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- 16. Customer Outstanding Report ---');
  const custOutstanding = ReportsService.getCustomerOutstandingReport();
  const retAOutstanding = custOutstanding.rows.find((r) => r.customerId === 'cust-retailer-a');
  const distBOutstanding = custOutstanding.rows.find((r) => r.customerId === 'cust-distributor-b');
  assert(retAOutstanding !== undefined, 'Retailer A in outstanding report');
  assert(retAOutstanding?.totalInvoiced === 7875.0, 'Retailer A invoiced = ₹7,875.00');
  assert(retAOutstanding?.totalPaid === 4000.0, 'Retailer A paid = ₹4,000.00');
  assert(retAOutstanding?.netOutstanding === 3875.0, 'Retailer A net outstanding = ₹3,875.00');
  assert(distBOutstanding !== undefined, 'Distributor B in outstanding report');
  assert(distBOutstanding?.netOutstanding === 976.5, 'Distributor B net outstanding = ₹976.50');
  assert(custOutstanding.summary.totalNetOutstanding === 4851.5, 'Total net outstanding = ₹4,851.50 (₹3,875.00 + ₹976.50)');

  // -------------------------------------------------------------------------
  // STEP 17: REPORT 17 - RECEIVABLES AGEING REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- 17. Receivables Ageing Report ---');
  const ageingReport = ReportsService.getReceivablesAgeingReport();
  assert(ageingReport.summary.totalReceivables === 4851.5, 'Total receivables = ₹4,851.50');
  assert(ageingReport.summary.bracket0To30 === 4851.5, '0-30 days bracket holds ₹4,851.50');
  assert(ageingReport.summary.bracketAbove90 === 0.0, '>90 days bracket holds ₹0.00');

  // -------------------------------------------------------------------------
  // STEP 18: AUDIT TRAIL REPORT
  // -------------------------------------------------------------------------
  console.log('\n--- Audit Trail Report ---');
  const auditReport = ReportsService.getAuditTrail();
  assert(auditReport.rows.length >= 5, 'Audit trail captures all operations');
  const entities = new Set(auditReport.rows.map((r) => r.entityName));
  assert(entities.has('SALES_ORDER'), 'Audit captures SALES_ORDER');
  assert(entities.has('GST_INVOICE'), 'Audit captures GST_INVOICE');
  assert(entities.has('DISPATCH'), 'Audit captures DISPATCH');
  assert(entities.has('PAYMENT'), 'Audit captures PAYMENT');

  // -------------------------------------------------------------------------
  // STEP 19: DASHBOARDS (OWNER, ADMIN, PRODUCTION)
  // -------------------------------------------------------------------------
  console.log('\n--- Executive Dashboards ---');
  const ownerDash = ReportsService.getOwnerDashboardData();
  assert(ownerDash.totalSalesRevenue === 8851.5, 'Owner Dashboard: Total revenue = ₹8,851.50');
  assert(ownerDash.totalProductionGoodPackets === 188, 'Owner Dashboard: Good packets = 188');
  assert(ownerDash.availableFinishedGoodsPackets === 88, 'Owner Dashboard: Available FG = 88 pkts');
  assert(ownerDash.totalOutstandingReceivables === 4851.5, 'Owner Dashboard: Total receivables = ₹4,851.50');
  assert(ownerDash.benchmarkCostPerPacket === 31.633, 'Owner Dashboard: Benchmark cost per packet = ₹31.6330');

  const adminDash = ReportsService.getAdminDashboardData();
  assert(adminDash.orders.totalCount === 2, 'Admin Dashboard: Total orders = 2');
  assert(adminDash.invoicesGeneratedCount === 2, 'Admin Dashboard: Invoices generated = 2');
  assert(adminDash.customerCollectionsTotal === 4000.0, 'Admin Dashboard: Collections total = ₹4,000.00');

  const prodDash = ReportsService.getProductionDashboardData();
  assert(prodDash.totalProductionRuns === 1, 'Production Dashboard: Total runs = 1');
  assert(prodDash.plannedVsActual.actualGoodOutput === 188, 'Production Dashboard: Actual good output = 188');
  assert(prodDash.plannedVsActual.damagedPackets === 12, 'Production Dashboard: Damaged output = 12');
  assert(prodDash.plannedVsActual.overallYieldPct === 94.0, 'Production Dashboard: Overall yield % = 94.00%');

  // -------------------------------------------------------------------------
  // STEP 20: CSV EXPORT SERIALIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- Universal CSV Export ---');
  const salesCsv = ReportsService.exportReportToCSV('sales-register');
  assert(salesCsv.includes('Invoice Number,Invoice Date'), 'Sales CSV contains header');
  assert(salesCsv.includes('8851.5'), 'Sales CSV contains grand total');

  const ledgerCsv = ReportsService.exportReportToCSV('stock-ledger');
  assert(ledgerCsv.includes('Timestamp,Item Code,Item Name'), 'Ledger CSV contains header');

  const costCsv = ReportsService.exportReportToCSV('cost-per-packet');
  assert(costCsv.includes('31.633'), 'Cost CSV contains unit cost');

  const auditCsv = ReportsService.exportReportToCSV('audit-trail');
  assert(auditCsv.includes('Timestamp,User ID,Action'), 'Audit CSV contains header');

  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RUN COMPLETE: ${passedTests} / ${totalTests} PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
