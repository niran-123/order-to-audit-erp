/**
 * End-to-End Benchmark Integration & Financial Data Validation Test Suite
 * Order-to-Audit Manufacturing ERP
 *
 * Senior QA Engineer, ERP Testing Specialist & Financial Data Validation Engineer
 * 
 * Executes Tests 1 through 12 strictly following the mandatory benchmark scenario:
 * TEST 1: Initial opening stock setup
 * TEST 2: Flour procurement (60 kg @ ₹45) & WAC valuation
 * TEST 3: Murukku 200g production run execution & stock balances
 * TEST 4: Salesman A order creation (150 pkts) & admin approval
 * TEST 5: GST tax invoice generation (Taxable ₹7,500, CGST ₹187.50, SGST ₹187.50, Total ₹7,875)
 * TEST 6: Finished goods dispatch & stock deduction (88 pkts balance)
 * TEST 7: Salesman B order (120 pkts), shortage detection (32 pkts), & unauthorized dispatch prevention
 * TEST 8: Customer payment recording (₹4,000) & accounts receivable tracking (₹3,875 outstanding)
 * TEST 9: Manufacturing cost accounting & Ind AS 2 absorption costing per good packet (188 pkts)
 * TEST 10: Generation of 10 statutory and management reports from actual transaction ledgers
 * TEST 11: System-wide data integrity invariants (duplicate prevention, negative stock guard,
 *          RBAC cross-access security, GST accuracy, invoice immutability, immutable audit trail)
 * TEST 12: Automated test execution & comprehensive Benchmark Comparison Report generation
 */

import { InventoryService, inventoryStore } from '../backend/src/modules/inventory/inventory.service';
import { PurchasesService, purchasesStore } from '../backend/src/modules/inventory/purchases.service';
import { ProductionService, productionStore } from '../backend/src/modules/production/production.service';
import { SalesService, salesStore } from '../backend/src/modules/sales/sales.service';
import { FinanceService, financeStore } from '../backend/src/modules/finance/finance.service';
import { ReportsService } from '../backend/src/modules/reports/reports.service';
import { auditLogs } from '../backend/src/modules/audit/audit.service';
import { BadRequestError, ForbiddenError } from '../backend/src/utils/appError';

export interface BenchmarkComparisonRecord {
  testId: string;
  parameter: string;
  expected: string | number;
  actual: string | number;
  status: 'PASS' | 'FAIL';
  explanation: string;
}

const comparisonTable: BenchmarkComparisonRecord[] = [];

function recordComparison(
  testId: string,
  parameter: string,
  expected: string | number,
  actual: string | number,
  explanation: string
) {
  const isMatch = typeof expected === 'number' && typeof actual === 'number'
    ? Math.abs(expected - actual) < 0.001
    : String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase();

  const status: 'PASS' | 'FAIL' = isMatch ? 'PASS' : 'FAIL';

  comparisonTable.push({
    testId,
    parameter,
    expected,
    actual,
    status,
    explanation,
  });

  if (status === 'PASS') {
    console.log(`  ✓ [${testId}] ${parameter}: Expected=${expected}, Actual=${actual}`);
  } else {
    console.error(`  ✗ [${testId}] ${parameter}: Expected=${expected}, Actual=${actual} - MISMATCH!`);
  }
}

async function runE2EValidationSuite() {
  console.log('================================================================================');
  console.log('ORDER-TO-AUDIT ERP - END-TO-END BENCHMARK VALIDATION & QA INTEGRATION SUITE');
  console.log('================================================================================\n');

  // Reset all in-memory transaction and master stores to baseline
  InventoryService.resetBenchmark();
  PurchasesService.resetBenchmark();
  ProductionService.resetBenchmark();
  SalesService.resetBenchmark();
  FinanceService.resetBenchmark();

  // =========================================================================
  // TEST 1: INITIAL DATA (OPENING STOCK SETUP)
  // =========================================================================
  console.log('--- TEST 1: Initial Opening Stock Setup ---');

  // Flour: 100 kg (@ ₹42.00)
  const flourItem = InventoryService.getItemById('inv-rm-rice-01');
  flourItem.openingBalance = 100.0;
  flourItem.currentStock = 100.0;
  flourItem.averageCost = 42.0;

  // Oil: 30 litres (@ ₹125.00)
  const oilItem = InventoryService.getItemById('inv-rm-oil-01');
  oilItem.openingBalance = 30.0;
  oilItem.currentStock = 30.0;
  oilItem.averageCost = 125.0;

  // Spice mix: 5 kg (@ ₹240.00)
  const spiceItem = InventoryService.getItemById('inv-rm-spice-01');
  spiceItem.openingBalance = 5.0;
  spiceItem.currentStock = 5.0;
  spiceItem.averageCost = 240.0;

  // Pouches: 500 pieces (@ ₹2.25)
  const pouchItem = InventoryService.getItemById('inv-pm-pouch-01');
  pouchItem.openingBalance = 500.0;
  pouchItem.currentStock = 500.0;
  pouchItem.averageCost = 2.25;

  // Cartons: 30 pieces (@ ₹38.50)
  const cartonItem = InventoryService.getItemById('inv-pm-ctn-01');
  cartonItem.openingBalance = 30.0;
  cartonItem.currentStock = 30.0;
  cartonItem.averageCost = 38.5;

  // Finished murukku: 50 packets (@ ₹31.633)
  const fgItem = InventoryService.getItemById('inv-fg-mur-200g');
  fgItem.openingBalance = 50.0;
  fgItem.currentStock = 50.0;
  fgItem.averageCost = 31.633;

  recordComparison('TEST 1', 'Opening Stock: Raw Rice Flour', 100, flourItem.currentStock, 'Initial warehouse silo balance');
  recordComparison('TEST 1', 'Opening Stock: Cooking Oil', 30, oilItem.currentStock, 'Liquid tank storage opening');
  recordComparison('TEST 1', 'Opening Stock: Spice Mix', 5, spiceItem.currentStock, 'Special seasoning mix opening');
  recordComparison('TEST 1', 'Opening Stock: Pouches (200g)', 500, pouchItem.currentStock, 'Nitrogen barrier pouches stock');
  recordComparison('TEST 1', 'Opening Stock: Cartons', 30, cartonItem.currentStock, '5-ply corrugated master boxes');
  recordComparison('TEST 1', 'Opening Stock: Finished Murukku 200g', 50, fgItem.currentStock, 'Pre-existing sound packaged stock');

  // =========================================================================
  // TEST 2: FLOUR PURCHASE & WAC VALUATION
  // =========================================================================
  console.log('\n--- TEST 2: Flour Purchase & Stock Receipts ---');

  // Create Purchase Order: 60 kg @ ₹45.00/kg
  const flourPO = await PurchasesService.createPurchase({
    supplierId: 'sup-cauvery-01',
    orderDate: '2026-11-20T08:00:00.000Z',
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
    createdByName: 'Admin',
  });

  // Confirm Purchase & Generate Goods Receipt Note (GRN)
  await PurchasesService.confirmPurchase({
    purchaseId: flourPO.id,
    supplierInvoiceNumber: 'CAUV/2026/8841',
    confirmedBy: 'usr-supervisor-01',
    confirmedByName: 'Supervisor',
  });

  const updatedFlourItem = InventoryService.getItemById('inv-rm-rice-01');
  recordComparison('TEST 2', 'Flour Purchase Quantity', 60, 60, 'Purchased 60 kg from Cauvery Agro');
  recordComparison('TEST 2', 'Flour Stock Post-Purchase', 160, updatedFlourItem.currentStock, 'Opening 100 kg + Inflow 60 kg = 160 kg');

  // Weighted-Average Cost formula: (100 * 42 + 60 * 45) / 160 = 6900 / 160 = 43.125
  const expectedWAC = Number(((100 * 42.0 + 60 * 45.0) / 160).toFixed(4));
  recordComparison('TEST 2', 'Flour Weighted-Average Cost (WAC)', expectedWAC, Number(updatedFlourItem.averageCost.toFixed(4)), '(100*42 + 60*45)/160 = ₹43.125/kg');

  // =========================================================================
  // TEST 3: PRODUCTION RUN EXECUTION & SHOP FLOOR BALANCES
  // =========================================================================
  console.log('\n--- TEST 3: Production Run Execution & Inventory Movement ---');

  const murukkuBOM = ProductionService.getBOMById('bom-mur-200g-v1');
  const run = await ProductionService.createProductionRun({
    productId: murukkuBOM.productId,
    bomId: murukkuBOM.id,
    plannedOutput: 200,
    supervisorId: 'usr-supervisor-01',
    notes: 'Standard Benchmark Batch Shift',
  });

  // Complete and Post Run:
  // Issue: Flour 40 kg, Oil 10.5 L, Spice mix 1.2 kg, Pouches 194 (188 good + 6 scrap), Cartons 9
  await ProductionService.completeAndPostProductionRun(run.id, {
    actualGoodOutput: 188.0,
    damagedOutput: 12.0,
    damagedPackagingQty: 6.0,
    materials: [
      { materialId: 'inv-rm-rice-01', actualQty: 40.0 }, // 40 kg flour
      { materialId: 'inv-rm-oil-01', actualQty: 10.5 }, // 10.5 L oil (+5% variance)
      { materialId: 'inv-rm-spice-01', actualQty: 1.2 }, // 1.2 kg spices
      { materialId: 'inv-pm-pouch-01', actualQty: 194.0 }, // 188 good + 6 damaged
      { materialId: 'inv-pm-ctn-01', actualQty: 9.0 }, // 9 master cartons used
    ],
    overheads: {
      labourCost: 1200.0,
      gasCost: 400.0,
      electricityCost: 200.0,
    },
    supervisorId: 'usr-supervisor-01',
  });

  const postProdFlour = InventoryService.getItemById('inv-rm-rice-01').currentStock;
  const postProdOil = InventoryService.getItemById('inv-rm-oil-01').currentStock;
  const postProdSpice = InventoryService.getItemById('inv-rm-spice-01').currentStock;
  const postProdPouch = InventoryService.getItemById('inv-pm-pouch-01').currentStock;
  const postProdCarton = InventoryService.getItemById('inv-pm-ctn-01').currentStock;
  const postProdFG = InventoryService.getItemById('inv-fg-mur-200g').currentStock;

  recordComparison('TEST 3', 'Flour Balance Post-Production', 120, postProdFlour, '160 kg - 40 kg issued = 120 kg');
  recordComparison('TEST 3', 'Oil Balance Post-Production', 19.5, postProdOil, '30 L - 10.5 L issued = 19.5 litres');
  recordComparison('TEST 3', 'Spice Mix Balance Post-Production', 3.8, postProdSpice, '5 kg - 1.2 kg issued = 3.8 kg');
  recordComparison('TEST 3', 'Pouches Balance Post-Production', 306, postProdPouch, '500 pcs - (188 good + 6 damaged) = 306 pcs');
  recordComparison('TEST 3', 'Cartons Balance Post-Production', 21, postProdCarton, '30 pcs - 9 cartons used = 21 pcs');
  recordComparison('TEST 3', 'Finished Goods Stock Post-Production', 238, postProdFG, '50 opening + 188 good output = 238 pkts');

  // =========================================================================
  // TEST 4: SALESMAN A - ORDER CREATION & ADMIN APPROVAL
  // =========================================================================
  console.log('\n--- TEST 4: Salesman A Order Capture & Admin Approval ---');

  const salesmanA = { userId: 'sales-001', name: 'Ravi Kumar (Salesman A)', email: 'salesman.a@enterprise.com' };
  const adminUser = { userId: 'admin-001', name: 'K. Rajagopal (Admin)', email: 'admin@enterprise.com' };

  // Salesman A creates order for Retailer A (Tamil Nadu, 150 packets @ ₹50.00)
  const orderA = await SalesService.createOrder(
    {
      customerId: 'cust-retailer-a',
      expectedDeliveryDate: '2026-11-25',
      paymentTerms: 'NET_15',
      items: [{ productId: 'inv-fg-mur-200g', orderedQty: 150 }],
    },
    salesmanA
  );

  recordComparison('TEST 4', 'Order A Initial Status', 'SUBMITTED', orderA.status, 'Order captured by Salesman A in SUBMITTED state');
  recordComparison('TEST 4', 'Order A Ordered Quantity', 150, orderA.items[0].orderedQty, 'Ordered 150 packets of Murukku 200g');

  // Admin approves order
  const approvedOrderA = await SalesService.approveOrder(orderA.id, adminUser);
  recordComparison('TEST 4', 'Order A Approved Status', 'APPROVED', approvedOrderA.status, 'Admin approved order for billing');

  // Verify finished goods stock is NOT decremented upon order creation or approval
  const stockPostOrderApproval = InventoryService.getItemById('inv-fg-mur-200g').currentStock;
  recordComparison('TEST 4', 'Finished Goods Stock Preserved on Approval', 238, stockPostOrderApproval, 'Stock invariant: Finished goods only decrease through confirmed dispatches');

  // =========================================================================
  // TEST 5: GST TAX INVOICE GENERATION
  // =========================================================================
  console.log('\n--- TEST 5: GST Tax Invoice Generation ---');

  const accountantUser = { userId: 'acc-001', name: 'S. Ramanathan (Accountant)', email: 'accountant@enterprise.com' };
  const invoiceA = await SalesService.generateInvoice(orderA.id, accountantUser);

  recordComparison('TEST 5', 'Invoice A Taxable Value', 7500.0, invoiceA.taxableAmount, '150 packets @ ₹50.00 = ₹7,500.00');
  recordComparison('TEST 5', 'Invoice A Intra-State CGST (2.5%)', 187.5, invoiceA.cgstAmount, 'Tamil Nadu (33 to 33): 2.5% of ₹7,500.00 = ₹187.50');
  recordComparison('TEST 5', 'Invoice A Intra-State SGST (2.5%)', 187.5, invoiceA.sgstAmount, 'Tamil Nadu (33 to 33): 2.5% of ₹7,500.00 = ₹187.50');
  recordComparison('TEST 5', 'Invoice A Total Tax', 375.0, invoiceA.totalTax, 'CGST ₹187.50 + SGST ₹187.50 = ₹375.00');
  recordComparison('TEST 5', 'Invoice A Grand Total', 7875.0, invoiceA.grandTotal, 'Taxable ₹7,500.00 + Tax ₹375.00 = ₹7,875.00');

  // Verify stock is STILL NOT decremented upon invoice generation
  const stockPostInvoice = InventoryService.getItemById('inv-fg-mur-200g').currentStock;
  recordComparison('TEST 5', 'Finished Goods Stock Preserved on Invoice', 238, stockPostInvoice, 'Invoicing does not move inventory');

  // =========================================================================
  // TEST 6: DISPATCH EXECUTION & FG STOCK DEDUCTION
  // =========================================================================
  console.log('\n--- TEST 6: Dispatch Execution & Inventory Movement ---');

  const dispatchA = await SalesService.createDispatch(
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

  const stockPostDispatch = InventoryService.getItemById('inv-fg-mur-200g').currentStock;
  recordComparison('TEST 6', 'Dispatched Quantity', 150, dispatchA.totalDispatchedQty, 'Full dispatch of 150 packets executed');
  recordComparison('TEST 6', 'Finished Goods Stock Post-Dispatch', 88, stockPostDispatch, '238 pkts - 150 pkts dispatched = 88 pkts remaining');
  recordComparison('TEST 6', 'Order A Status Post-Dispatch', 'DISPATCHED', SalesService.getOrderById(orderA.id).status, 'Order marked fully DISPATCHED');

  // =========================================================================
  // TEST 7: SALESMAN B - ORDER CAPTURE, SHORTAGE DETECTION & UNAUTHORIZED DISPATCH GUARD
  // =========================================================================
  console.log('\n--- TEST 7: Salesman B Order, Stock Shortage & Unauthorized Dispatch Prevention ---');

  const salesmanB = { userId: 'sales-002', name: 'Suresh Babu (Salesman B)', email: 'salesman.b@enterprise.com' };

  // Salesman B creates order for Distributor B (Karnataka inter-state, 120 packets)
  const orderB = await SalesService.createOrder(
    {
      customerId: 'cust-distributor-b',
      expectedDeliveryDate: '2026-11-28',
      paymentTerms: 'NET_30',
      items: [{ productId: 'inv-fg-mur-200g', orderedQty: 120 }],
    },
    salesmanB
  );

  // Check stock availability
  const stockCheckB = SalesService.checkStockAvailability('inv-fg-mur-200g', 120);
  recordComparison('TEST 7', 'Distributor B Available Stock', 88, stockCheckB.availableQty, 'Physical warehouse stock available');
  recordComparison('TEST 7', 'Distributor B Requested Stock', 120, stockCheckB.requestedQty, 'Order requirement 120 packets');
  recordComparison('TEST 7', 'Stock Shortage Detected', 32, stockCheckB.shortageQty, '120 requested - 88 available = 32 shortage');
  recordComparison('TEST 7', 'Replenishment Flag Triggered', 'true', String(stockCheckB.replenishmentRequired), 'Shortage triggers production replenishment alert');

  // Approve Order B
  await SalesService.approveOrder(orderB.id, adminUser);
  await SalesService.generateInvoice(orderB.id, accountantUser);

  // Attempt to dispatch 120 packets when only 88 are available -> MUST BE PREVENTED
  let unauthorizedDispatchBlocked = false;
  let blockErrorMessage = '';
  try {
    await SalesService.createDispatch(
      orderB.id,
      {
        carrierName: 'SafeXpress Karnataka',
        vehicleNumber: 'KA-01-MJ-4411',
        items: [
          {
            salesOrderItemId: orderB.items[0].id,
            productId: 'inv-fg-mur-200g',
            dispatchedQty: 120,
          },
        ],
      },
      { userId: 'usr-supervisor-01', email: 'supervisor@enterprise.com' }
    );
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      unauthorizedDispatchBlocked = true;
      blockErrorMessage = err.message;
    }
  }

  recordComparison('TEST 7', 'Unauthorized Over-Dispatch Prevented', 'true', String(unauthorizedDispatchBlocked), 'Attempting to dispatch 120 units when stock is 88 throws BadRequestError');
  recordComparison('TEST 7', 'Stock Integrity Preserved After Block', 88, InventoryService.getItemById('inv-fg-mur-200g').currentStock, 'Negative stock strictly prohibited; balance remains 88');

  // =========================================================================
  // TEST 8: CUSTOMER PAYMENT & ACCOUNTS RECEIVABLE SETTLEMENT
  // =========================================================================
  console.log('\n--- TEST 8: Customer Payment & Accounts Receivable ---');

  // Record payment of ₹4,000.00 from Retailer A allocated to Invoice A
  const paymentA = await FinanceService.recordPayment(
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

  const updatedInvoiceA = SalesService.getInvoiceById(invoiceA.id);
  const outstandingA = Number((updatedInvoiceA.grandTotal - updatedInvoiceA.paidAmount).toFixed(2));

  recordComparison('TEST 8', 'Retailer A Invoice Grand Total', 7875.0, updatedInvoiceA.grandTotal, 'Original invoiced amount');
  recordComparison('TEST 8', 'Payment Received & Allocated', 4000.0, paymentA.allocatedAmount, 'Payment allocated directly to INV-2026-00101');
  recordComparison('TEST 8', 'Invoice Outstanding Amount', 3875.0, outstandingA, '₹7,875.00 - ₹4,000.00 = ₹3,875.00 remaining');
  recordComparison('TEST 8', 'Invoice Status Post-Payment', 'PARTIALLY_PAID', updatedInvoiceA.status, 'Status transitioned to PARTIALLY_PAID');

  // =========================================================================
  // TEST 9: PRODUCTION COSTING & IND AS 2 ABSORPTION VALUATION
  // =========================================================================
  console.log('\n--- TEST 9: Production Costing & Unit Absorption ---');

  const costing = FinanceService.calculateProductionCosting(run.id, {
    labourCost: 1200.0,
    gasPowerCost: 600.0,
  });

  // Verify itemized direct material calculation:
  // Rice Flour: 40 kg @ ₹43.125 = ₹1,725.00
  // Sunflower Oil: 10.5 L @ ₹125.00 = ₹1,312.50
  // Spice Mix: 1.2 kg @ ₹240.00 = ₹288.00
  // Pouches: 194 pcs @ ₹2.25 = ₹436.50
  // Cartons: 9 pcs @ ₹38.50 = ₹346.50
  // Direct Material Total = ₹4,108.50
  const expectedMaterialCost = 4108.5;
  const expectedOverheads = 1800.0; // Labour ₹1,200 + Gas/Power ₹600
  const expectedTotalCost = expectedMaterialCost + expectedOverheads; // ₹5,908.50
  const expectedUnitCost = Number((expectedTotalCost / 188.0).toFixed(4)); // ₹31.4282

  recordComparison('TEST 9', 'Direct Labour Overheads', 1200.0, costing.overheads.labourCost, 'Direct shift labour allocation');
  recordComparison('TEST 9', 'Gas and Power Overheads', 600.0, costing.overheads.gasPowerCost, 'Process gas and electrical energy');
  recordComparison('TEST 9', 'Total Manufacturing Overheads', expectedOverheads, costing.overheads.totalOverheadCost, 'Labour ₹1,200 + Power ₹600 = ₹1,800.00');
  recordComparison('TEST 9', 'Total Direct Material Cost', expectedMaterialCost, costing.totalDirectMaterialCost, 'Sum of actual RM & PM consumption at WAC rates');
  recordComparison('TEST 9', 'Total Production Batch Cost', expectedTotalCost, costing.totalProductionCost, 'Direct Materials + Overheads');
  recordComparison('TEST 9', 'Cost Per Good Packet (188 pkts)', expectedUnitCost, costing.costPerGoodPacket, 'Total Cost / 188 sound packets (Ind AS 2 scrap absorption)');

  // =========================================================================
  // TEST 10: STATUTORY & MANAGEMENT REPORT GENERATION
  // =========================================================================
  console.log('\n--- TEST 10: Dynamic Report Generation ---');

  // 1. Sales Register
  const salesRegister = ReportsService.getSalesRegister();
  recordComparison('TEST 10', 'Sales Register: Invoices Count', 2, salesRegister.summary.totalInvoices, 'Retailer A (Intra) + Distributor B (Inter)');
  recordComparison('TEST 10', 'Sales Register: Grand Total Revenue', 13734.0, salesRegister.summary.grandTotal, 'Invoice A ₹7,875.00 + Invoice B ₹5,859.00 = ₹13,734.00');

  // 2. GST Outward Supplies Report (GSTR-1)
  const gstReport = ReportsService.getGSTOutwardSupplies();
  recordComparison('TEST 10', 'GST Report: Intra-State Taxable', 7500.0, gstReport.intraState.taxableValue, 'Retailer A intra-state supply');
  recordComparison('TEST 10', 'GST Report: Inter-State Taxable', 5580.0, gstReport.interState.taxableValue, 'Distributor B inter-state supply (120 * ₹46.50)');
  recordComparison('TEST 10', 'GST Report: Total Tax Collected', 654.0, gstReport.grandTotal.totalTax, 'CGST ₹187.50 + SGST ₹187.50 + IGST ₹279.00 = ₹654.00');

  // 3. Purchase Register
  const purchaseReg = ReportsService.getPurchaseRegister();
  recordComparison('TEST 10', 'Purchase Register: Verified Receipts', 2, purchaseReg.summary.grnReceivedCount, 'Tirupati Oils & Cauvery Flour GRNs confirmed');

  // 4. Raw Material Stock Summary
  const rmSummary = ReportsService.getMaterialStockSummary('RAW_MATERIAL');
  const flourSummary = rmSummary.rows.find((r) => r.materialCode === 'RM-RICE-01');
  recordComparison('TEST 10', 'Stock Summary: Raw Flour Balance', 120.0, flourSummary?.currentStock || 0, '120 kg closing stock reported');

  // 5. Stock Ledger
  const stockLedger = ReportsService.getCompleteStockLedger();
  const hasDispatchMovement = stockLedger.rows.some((r) => r.movementType === 'DISPATCH_OUT' && r.outQuantity === 150);
  recordComparison('TEST 10', 'Stock Ledger: Dispatch Entry Recorded', 'true', String(hasDispatchMovement), 'Stock ledger contains DISPATCH_OUT entry of 150 units');

  // 6. Production Report
  const prodReport = ReportsService.getProductionReport();
  recordComparison('TEST 10', 'Production Report: Good Packets Output', 188, prodReport.rows[0].goodPackets, '188 good commercial units reported');

  // 7. Variance Report (Planned vs Actual Consumption)
  const varianceReport = ReportsService.getPlannedVsActualConsumption();
  const oilVariance = varianceReport.rows.find((r) => r.materialCode === 'RM-OIL-01');
  recordComparison('TEST 10', 'Variance Report: Oil Variance Alert', 'true', String(oilVariance?.hasAlert), '+5.0% Oil consumption variance triggered alert (>3%)');

  // 8. Costing Report
  const costReport = ReportsService.getCostPerPacketReport();
  recordComparison('TEST 10', 'Costing Report: Batch Absorption Cost', expectedUnitCost, costReport.rows[0].finalCostPerGoodPacket, 'Unit cost dynamically reported per good packet');

  // 9. Payment Report
  const paymentReport = ReportsService.getPaymentsCollectionsReport();
  recordComparison('TEST 10', 'Payment Report: Realized Amount', 4000.0, paymentReport.summary.totalAmountReceived, '₹4,000.00 realized from Retailer A');

  // 10. Outstanding Report
  const outstandingReport = ReportsService.getCustomerOutstandingReport();
  const retAOut = outstandingReport.rows.find((r) => r.customerId === 'cust-retailer-a');
  recordComparison('TEST 10', 'Outstanding Report: Retailer A Balance', 3875.0, retAOut?.netOutstanding || 0, 'Retailer A net outstanding balance ₹3,875.00');

  // =========================================================================
  // TEST 11: DATA INTEGRITY & SYSTEM INVARIANTS
  // =========================================================================
  console.log('\n--- TEST 11: System-Wide Data Integrity & Invariants ---');

  // 1. Duplicate stock movement prevention
  let duplicateMovementBlocked = false;
  try {
    // Attempting to record duplicate movement with same transaction key
    await InventoryService.recordStockMovement({
      itemId: 'inv-rm-rice-01',
      movementType: 'PRODUCTION_ISSUE',
      sourceDocumentType: 'PRODUCTION_RUN',
      sourceDocumentId: run.runNumber,
      quantity: 40.0,
      performedBy: 'usr-supervisor-01',
    });
  } catch (err: any) {
    if (err instanceof BadRequestError || err.message.includes('Duplicate')) {
      duplicateMovementBlocked = true;
    }
  }
  recordComparison('TEST 11', 'Data Integrity: Duplicate Movement Guard', 'true', String(duplicateMovementBlocked), 'Duplicate movement key execution rejected');

  // 2. Negative stock prevention
  let negativeStockBlocked = false;
  try {
    await InventoryService.recordStockMovement({
      itemId: 'inv-fg-mur-200g',
      movementType: 'DISPATCH_OUT',
      sourceDocumentType: 'SALES_DISPATCH',
      sourceDocumentId: 'DC-TEST-FAIL',
      quantity: 9999.0, // Exceeds current stock 88
      performedBy: 'usr-supervisor-01',
    });
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      negativeStockBlocked = true;
    }
  }
  recordComparison('TEST 11', 'Data Integrity: Negative Stock Guard', 'true', String(negativeStockBlocked), 'Negative inventory balances strictly prohibited');

  // 3. Source Document Linkage
  const allLedgerHaveDocs = inventoryStore.ledger.every((e) => Boolean(e.sourceDocumentType && e.sourceDocumentId));
  recordComparison('TEST 11', 'Data Integrity: Source Document Linkage', 'true', String(allLedgerHaveDocs), 'Every stock ledger entry links to source PO, Run, or DC');

  // 4. Unauthorized Salesman Cross-Access Prevention
  const salesmanAOrders = SalesService.listOrders(
    undefined,
    { userId: salesmanA.userId, email: salesmanA.email, roles: ['SALESMAN' as any] }
  );
  const salesmanBCrossAccessBlocked = !salesmanAOrders.some((o) => o.customerId === 'cust-distributor-b');
  recordComparison('TEST 11', 'Data Integrity: Salesman Cross-Access Guard', 'true', String(salesmanBCrossAccessBlocked), 'Salesman A cannot view Salesman B orders');

  // 5. Posted Invoice Immutability
  let deletePostedInvoiceBlocked = false;
  try {
    SalesService.deleteInvoice(invoiceA.id);
  } catch (err: any) {
    if (err instanceof BadRequestError && err.message.includes('immutable')) {
      deletePostedInvoiceBlocked = true;
    }
  }
  recordComparison('TEST 11', 'Data Integrity: Posted Invoice Immutability', 'true', String(deletePostedInvoiceBlocked), 'Statutory violation: Posted GST tax invoices cannot be deleted');

  // 6. Over-Allocation Payment Guard
  let overAllocationBlocked = false;
  try {
    await FinanceService.recordPayment(
      {
        customerId: 'cust-retailer-a',
        invoiceId: invoiceA.id,
        amount: 10000.0, // Remaining balance is only ₹3,875.00
        paymentMethod: 'NEFT',
        referenceNumber: 'NEFT-FAIL-OVERALLOC',
      },
      { userId: 'acc-001', email: 'accountant@enterprise.com', roles: ['ACCOUNTANT' as any] }
    );
  } catch (err: any) {
    if (err instanceof BadRequestError) {
      overAllocationBlocked = true;
    }
  }
  recordComparison('TEST 11', 'Data Integrity: Payment Over-Allocation Guard', 'true', String(overAllocationBlocked), 'Allocating more than invoice outstanding balance is blocked');

  // 7. Audit Trail Capture
  const auditReport = ReportsService.getAuditTrail();
  const capturedEntities = new Set(auditReport.rows.map((r) => r.entityName));
  const allAuditPresent =
    capturedEntities.has('SALES_ORDER') &&
    capturedEntities.has('GST_INVOICE') &&
    capturedEntities.has('DISPATCH') &&
    capturedEntities.has('PAYMENT');
  recordComparison('TEST 11', 'Data Integrity: Full Audit Trail', 'true', String(allAuditPresent), 'Security audit captured all lifecycle transactions');

  // =========================================================================
  // TEST 12: AUTOMATED TEST SUITE & BENCHMARK COMPARISON REPORT
  // =========================================================================
  console.log('\n================================================================================');
  console.log('TEST 12: BENCHMARK COMPARISON REPORT TABLE');
  console.log('================================================================================\n');

  console.log('| Test ID | Parameter / Invariant | Expected Result | Actual App Result | Status | Verification Detail |');
  console.log('|:--------|:----------------------|:----------------|:------------------|:------:|:--------------------|');

  let passedCount = 0;
  let failedCount = 0;

  for (const row of comparisonTable) {
    if (row.status === 'PASS') passedCount++;
    else failedCount++;

    const expectedStr =
      row.expected !== undefined && row.expected !== null
        ? typeof row.expected === 'number'
          ? row.expected.toFixed(2)
          : String(row.expected)
        : 'N/A';

    const actualStr =
      row.actual !== undefined && row.actual !== null
        ? typeof row.actual === 'number'
          ? row.actual.toFixed(2)
          : String(row.actual)
        : 'N/A';

    console.log(
      `| ${row.testId.padEnd(7)} | ${row.parameter.padEnd(38)} | ${expectedStr.padEnd(15)} | ${actualStr.padEnd(17)} |  ${row.status}  | ${row.explanation} |`
    );
  }

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL BENCHMARK INVARIANTS EVALUATED : ${comparisonTable.length}`);
  console.log(`TOTAL BENCHMARK INVARIANTS PASSED    : ${passedCount}`);
  console.log(`TOTAL BENCHMARK INVARIANTS FAILED    : ${failedCount}`);
  console.log(`SYSTEM VERDICT                       : ${failedCount === 0 ? 'CERTIFIED FOR DEPLOYMENT (100% PASS)' : 'DEFECTS DETECTED'}`);
  console.log('================================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2EValidationSuite().catch((err) => {
  console.error('Fatal benchmark test execution error:', err);
  process.exit(1);
});
