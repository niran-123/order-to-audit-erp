/**
 * Order-to-Audit Manufacturing ERP
 * Comprehensive Inventory & Purchase Verification Suite
 * 
 * Verifies:
 * 1. Benchmark Opening Balances (Rice flour 100 kg @ ₹42.00/kg)
 * 2. 4-Category Inventory Segregation (RM, PM, WIP, FG)
 * 3. Purchase Order Lifecycle & GRN Confirmation
 * 4. Automated Inventory Increase
 * 5. Weighted-Average Cost Recalculation ((100*42 + 60*45)/160 = ₹43.125/kg)
 * 6. Production Issue Valuation at Weighted Average Rate
 * 7. Negative Stock Prevention
 * 8. Duplicate Movement Rejection
 * 9. Mathematical Formula Invariant
 * 10. Finished Goods Dispatch Rule (Decreases only on confirmed dispatch)
 * 11. Stock Ledger Running Balances & Auditability
 * 12. Physical Reconciliation via Stock Adjustment
 */

import { InventoryService } from '../backend/src/modules/inventory/inventory.service';
import { PurchasesService } from '../backend/src/modules/inventory/purchases.service';

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

async function runTests() {
  console.log('================================================================');
  console.log('ORDER-TO-AUDIT ERP - INVENTORY & PURCHASING VERIFICATION SUITE');
  console.log('================================================================\n');

  // Reset stores to benchmark state
  InventoryService.resetBenchmark();
  PurchasesService.resetBenchmark();

  // -------------------------------------------------------------
  // SUITE 1: Benchmark Opening Stock & 4-Category Segregation
  // -------------------------------------------------------------
  console.log('>> Suite 1: Benchmark Opening Stock & 4-Category Segregation');
  const dashboard = InventoryService.getInventoryDashboard();
  assert(dashboard.categorySummaries.length === 4, 'Categories', 'Exactly 4 inventory categories configured');

  const categories = dashboard.categorySummaries.map((c) => c.category);
  assert(categories.includes('RAW_MATERIAL'), 'Categories', 'RAW_MATERIAL category exists');
  assert(categories.includes('PACKAGING_MATERIAL'), 'Categories', 'PACKAGING_MATERIAL category exists');
  assert(categories.includes('WORK_IN_PROGRESS'), 'Categories', 'WORK_IN_PROGRESS category exists');
  assert(categories.includes('FINISHED_GOODS'), 'Categories', 'FINISHED_GOODS category exists');

  // Verify Benchmark Flour Opening Balance
  const flour = InventoryService.getItemById('inv-rm-rice-01');
  assert(flour.itemCode === 'RM-RICE-01', 'Opening Stock', 'Raw Rice Flour Grade A exists');
  assert(flour.currentStock === 100.0, 'Opening Stock', 'Opening quantity is exactly 100 kg');
  assert(flour.averageCost === 42.0, 'Opening Stock', 'Opening unit rate is exactly ₹42.00/kg');
  assert(flour.totalValuation === 4200.0, 'Opening Stock', 'Opening valuation is ₹4,200.00 (100 * 42)');
  assert(flour.unitCode === 'KG', 'Opening Stock', 'Unit is KG');

  // Verify Packaging Material Opening Balance
  const pouches = InventoryService.getItemById('inv-pm-pouch-01');
  assert(pouches.currentStock === 5000.0, 'Opening Stock', 'Murukku 200g pouches opening stock is 5000 pcs');
  assert(pouches.averageCost === 2.25, 'Opening Stock', 'Pouch rate is ₹2.25/pc');

  // Verify WIP Opening Balance
  const wipDough = InventoryService.getItemById('inv-wip-dough-01');
  assert(wipDough.currentStock === 25.0, 'Opening Stock', 'WIP Dough opening stock is 25 kg');
  assert(wipDough.averageCost === 58.0, 'Opening Stock', 'WIP Dough rate is ₹58.00/kg');

  // Verify Finished Goods Opening Balance
  const fgMurukku = InventoryService.getItemById('inv-fg-mur-200g');
  assert(fgMurukku.currentStock === 300.0, 'Opening Stock', 'Finished Goods Murukku 200g opening stock is 300 pkts');
  assert(fgMurukku.averageCost === 16.11, 'Opening Stock', 'FG Murukku unit cost is ₹16.11/pkt');

  // -------------------------------------------------------------
  // SUITE 2: Purchase Order Creation & Workflow
  // -------------------------------------------------------------
  console.log('\n>> Suite 2: Purchase Order Creation & Workflow');
  const po = await PurchasesService.createPurchase({
    supplierId: 'sup-cauvery-01',
    orderDate: '2026-11-20T10:00:00.000Z',
    expectedDeliveryDate: '2026-11-22T18:00:00.000Z',
    supplierInvoiceNumber: 'CAUV/2026/7821',
    items: [
      {
        itemType: 'RAW_MATERIAL',
        materialId: 'inv-rm-rice-01',
        orderedQty: 60.0, // Benchmark Purchase Quantity: 60 kg
        unitPrice: 45.0, // Benchmark Purchase Rate: ₹45.00/kg
        taxRate: 5.0, // 5% GST on flour
      },
    ],
    createdBy: 'usr-admin-01',
    createdByName: 'K. Rajagopal (Admin)',
  });

  assert(po.status === 'DRAFT', 'Purchases', 'Newly created PO is in DRAFT status');
  assert(po.poNumber.startsWith('PO-2026-'), 'Purchases', `PO number generated: ${po.poNumber}`);
  assert(po.items.length === 1, 'Purchases', 'PO contains 1 line item');
  assert(po.items[0].orderedQty === 60.0, 'Purchases', 'Ordered qty is 60 kg');
  assert(po.items[0].unitPrice === 45.0, 'Purchases', 'Purchase rate is ₹45.00/kg');
  assert(po.subtotal === 2700.0, 'Purchases', 'Subtotal is ₹2,700.00 (60 * 45)');
  assert(po.taxAmount === 135.0, 'Purchases', 'Tax amount is ₹135.00 (5% GST)');
  assert(po.totalAmount === 2835.0, 'Purchases', 'Total amount is ₹2,835.00');

  // Stock before confirmation must STILL be 100 kg
  const flourBeforeConfirm = InventoryService.getItemById('inv-rm-rice-01');
  assert(flourBeforeConfirm.currentStock === 100.0, 'Purchases', 'Stock is unaffected while PO is in DRAFT status');

  // -------------------------------------------------------------
  // SUITE 3: Purchase Confirmation & Weighted-Average Valuation
  // -------------------------------------------------------------
  console.log('\n>> Suite 3: Purchase Confirmation & Weighted-Average Valuation');
  const confirmedPO = await PurchasesService.confirmPurchase({
    purchaseId: po.id,
    supplierInvoiceNumber: 'CAUV/2026/7821',
    confirmedBy: 'usr-supervisor-01',
    confirmedByName: 'M. Senthil (Production Supervisor)',
  });

  assert(confirmedPO.status === 'RECEIVED', 'GRN Inflow', 'PO status updated to RECEIVED');
  assert(confirmedPO.grnNumber !== undefined, 'GRN Inflow', `GRN Goods Receipt Note created: ${confirmedPO.grnNumber}`);

  // Inspect Flour Inventory Post-GRN
  const flourAfterGRN = InventoryService.getItemById('inv-rm-rice-01');
  assert(flourAfterGRN.currentStock === 160.0, 'GRN Inflow', 'Flour current stock increased to exactly 160 kg (100 + 60)');
  assert(flourAfterGRN.totalReceipts === 60.0, 'GRN Inflow', 'Total receipts recorded 60 kg');

  // Mathematical Verification of Weighted-Average Unit Cost:
  // (100 kg * 42.00 + 60 kg * 45.00) / 160 kg = (4200 + 2700) / 160 = 6900 / 160 = 43.125 INR/kg
  const expectedWeightedAvgCost = 43.125;
  assert(
    Math.abs(flourAfterGRN.averageCost - expectedWeightedAvgCost) < 0.0001,
    'Valuation Rate',
    `Weighted-average unit cost is exactly ₹${flourAfterGRN.averageCost}/kg (Expected: ₹43.125/kg)`
  );

  const expectedTotalValuation = 160.0 * 43.125; // ₹6,900.00
  assert(
    Math.abs(flourAfterGRN.totalValuation - expectedTotalValuation) < 0.01,
    'Valuation Rate',
    `Flour total inventory valuation is exactly ₹${flourAfterGRN.totalValuation} (Expected: ₹6,900.00)`
  );

  // -------------------------------------------------------------
  // SUITE 4: Production Issue Valuation at Weighted-Average Rate
  // -------------------------------------------------------------
  console.log('\n>> Suite 4: Production Issue Valuation at Weighted-Average Rate');
  // Issue 80 kg of flour to Production Run RUN-2026-001
  const issueMovement = await InventoryService.issueMaterialToProduction({
    materialId: 'inv-rm-rice-01',
    productionRunId: 'RUN-2026-001',
    quantity: 80.0,
    performedBy: 'usr-supervisor-01',
  });

  assert(issueMovement.movementType === 'PRODUCTION_ISSUE', 'Production Issue', 'Movement type is PRODUCTION_ISSUE');
  assert(issueMovement.quantityOut === 80.0, 'Production Issue', 'Quantity issued is 80 kg');
  assert(
    Math.abs(issueMovement.unitCost - 43.125) < 0.0001,
    'Production Issue',
    `Production issue evaluated strictly at weighted-average rate ₹${issueMovement.unitCost}/kg`
  );
  assert(
    Math.abs(issueMovement.totalValue - 3450.0) < 0.01,
    'Production Issue',
    `Issue total value is exactly ₹${issueMovement.totalValue} (80 kg * ₹43.125/kg = ₹3,450.00)`
  );
  assert(issueMovement.runningBalance === 80.0, 'Production Issue', 'Running balance in ledger is 80 kg');

  const flourAfterIssue = InventoryService.getItemById('inv-rm-rice-01');
  assert(flourAfterIssue.currentStock === 80.0, 'Production Issue', 'Remaining stock is 80 kg (160 - 80)');
  assert(
    Math.abs(flourAfterIssue.averageCost - 43.125) < 0.0001,
    'Production Issue',
    'Remaining stock preserves weighted-average unit cost of ₹43.125/kg'
  );
  assert(
    Math.abs(flourAfterIssue.totalValuation - 3450.0) < 0.01,
    'Production Issue',
    'Remaining valuation is ₹3,450.00 (80 kg * ₹43.125/kg)'
  );

  // -------------------------------------------------------------
  // SUITE 5: Negative Stock Prevention
  // -------------------------------------------------------------
  console.log('\n>> Suite 5: Negative Stock Prevention');
  let negativeStockPrevented = false;
  try {
    // Attempting to issue 90 kg when only 80 kg is available
    await InventoryService.issueMaterialToProduction({
      materialId: 'inv-rm-rice-01',
      productionRunId: 'RUN-2026-002',
      quantity: 90.0,
      performedBy: 'usr-supervisor-01',
    });
  } catch (err: any) {
    negativeStockPrevented = true;
    assert(
      err.message.includes('Insufficient available stock'),
      'Negative Stock Rule',
      `Negative stock attempt rejected with expected error: "${err.message}"`
    );
  }
  assert(negativeStockPrevented, 'Negative Stock Rule', 'System strictly prevents negative stock');

  // Verify stock remained intact at 80 kg
  const flourUnchanged = InventoryService.getItemById('inv-rm-rice-01');
  assert(flourUnchanged.currentStock === 80.0, 'Negative Stock Rule', 'Stock remains unchanged at 80 kg');

  // -------------------------------------------------------------
  // SUITE 6: Duplicate Movement Prevention
  // -------------------------------------------------------------
  console.log('\n>> Suite 6: Duplicate Movement Prevention');
  let duplicatePrevented = false;
  try {
    // Attempting to re-issue using the EXACT same production run id
    await InventoryService.recordStockMovement({
      itemId: 'inv-rm-rice-01',
      movementType: 'PRODUCTION_ISSUE',
      sourceDocumentType: 'PRODUCTION_RUN',
      sourceDocumentId: 'RUN-2026-001', // same run ID
      quantity: 10.0,
      performedBy: 'usr-supervisor-01',
    });
  } catch (err: any) {
    duplicatePrevented = true;
    assert(
      err.message.includes('Duplicate stock movement rejected'),
      'Duplicate Prevention',
      `Duplicate movement rejected with message: "${err.message}"`
    );
  }
  assert(duplicatePrevented, 'Duplicate Prevention', 'System strictly prevents duplicate stock movements');

  // -------------------------------------------------------------
  // SUITE 7: Mathematical Invariant Formula Across All Buckets
  // -------------------------------------------------------------
  console.log('\n>> Suite 7: Mathematical Invariant Formula Across All Buckets');
  // Formula: Opening Balance + Receipts - Issues - Sales + Returns ± Adjustments = Closing Balance
  const formulaCheck =
    flourAfterIssue.openingBalance +
    flourAfterIssue.totalReceipts -
    flourAfterIssue.totalIssues -
    flourAfterIssue.totalSalesDispatched +
    flourAfterIssue.totalReturns +
    flourAfterIssue.totalAdjustments;

  assert(
    formulaCheck === flourAfterIssue.currentStock,
    'Balance Invariant',
    `Formula strictly holds: 100 (Opening) + 60 (Receipts) - 80 (Issues) - 0 (Sales) + 0 (Returns) ± 0 (Adj) = ${flourAfterIssue.currentStock} (Closing)`
  );

  // -------------------------------------------------------------
  // SUITE 8: Finished Goods Dispatch Isolation
  // -------------------------------------------------------------
  console.log('\n>> Suite 8: Finished Goods Dispatch Isolation');
  // Finished goods must only decrease through confirmed dispatches, not merely when an order is created.
  const fgBefore = InventoryService.getItemById('inv-fg-mur-200g');
  assert(fgBefore.currentStock === 300.0, 'FG Rule', 'FG initial stock is 300 packets');

  // Dispatch 100 packets via Delivery Challan DC-2026-001
  const dispatchMovement = await InventoryService.dispatchFinishedGoods({
    productId: 'inv-fg-mur-200g',
    dispatchChallanId: 'DC-2026-001',
    quantity: 100.0,
    performedBy: 'usr-supervisor-01',
    customerName: 'Sri Meenakshi Traders',
  });

  assert(dispatchMovement.movementType === 'DISPATCH_OUT', 'FG Rule', 'Movement type is DISPATCH_OUT');
  assert(dispatchMovement.sourceDocumentType === 'SALES_DISPATCH', 'FG Rule', 'Source document is SALES_DISPATCH');
  assert(dispatchMovement.quantityOut === 100.0, 'FG Rule', '100 packets dispatched');
  assert(dispatchMovement.runningBalance === 200.0, 'FG Rule', 'FG running balance is 200 packets');

  const fgAfter = InventoryService.getItemById('inv-fg-mur-200g');
  assert(fgAfter.currentStock === 200.0, 'FG Rule', 'FG current stock decreased to exactly 200 packets');
  assert(fgAfter.totalSalesDispatched === 100.0, 'FG Rule', 'totalSalesDispatched recorded 100 packets');

  // -------------------------------------------------------------
  // SUITE 9: Physical Stock Reconciliation via Stock Adjustment
  // -------------------------------------------------------------
  console.log('\n>> Suite 9: Physical Stock Reconciliation via Stock Adjustment');
  // Physical count reveals 195 packets of Murukku (5 packets damaged/missing during shelf audit)
  const reconcileMovement = await InventoryService.reconcileStock({
    itemId: 'inv-fg-mur-200g',
    physicalCount: 195.0,
    reason: 'Monthly physical warehouse cycle count audit - 5 pkts foil puncture scrap',
    performedBy: 'usr-auditor-01',
  });

  assert(reconcileMovement.movementType === 'STOCK_ADJUSTMENT', 'Reconciliation', 'Adjustment created as STOCK_ADJUSTMENT');
  assert(reconcileMovement.sourceDocumentType === 'STOCK_RECONCILIATION', 'Reconciliation', 'Source doc is STOCK_RECONCILIATION');
  assert(reconcileMovement.quantityOut === 5.0, 'Reconciliation', 'Adjustment out is 5 pkts');
  assert(reconcileMovement.runningBalance === 195.0, 'Reconciliation', 'New running balance matches physical count of 195');

  const fgReconciled = InventoryService.getItemById('inv-fg-mur-200g');
  assert(fgReconciled.currentStock === 195.0, 'Reconciliation', 'Closing balance is exactly 195 pkts');
  assert(fgReconciled.totalAdjustments === -5.0, 'Reconciliation', 'Total adjustments records -5 pkts');

  // -------------------------------------------------------------
  // SUITE 10: Stock Ledger Auditability & Source Document Linkage
  // -------------------------------------------------------------
  console.log('\n>> Suite 10: Stock Ledger Auditability & Source Document Linkage');
  const fullLedger = InventoryService.getStockLedger({ limit: 50 });
  assert(fullLedger.total >= 14, 'Ledger', `Total ledger movements recorded: ${fullLedger.total}`);

  // Verify every movement has all required audit fields
  for (const entry of fullLedger.items) {
    assert(!!entry.transactionId, 'Ledger', `Transaction ID present: ${entry.transactionId}`);
    assert(!!entry.itemName, 'Ledger', `Item name present: ${entry.itemName}`);
    assert(!!entry.movementType, 'Ledger', `Movement type present: ${entry.movementType}`);
    assert(entry.runningBalance !== undefined, 'Ledger', `Running balance present: ${entry.runningBalance}`);
    assert(!!entry.sourceDocumentType && !!entry.sourceDocumentId, 'Ledger', `Source doc linked: ${entry.sourceDocumentType}#${entry.sourceDocumentId}`);
    assert(!!entry.timestamp, 'Ledger', `Timestamp recorded: ${entry.timestamp}`);
    assert(!!entry.performedBy, 'Ledger', `Performer recorded: ${entry.performedBy}`);
  }

  // -------------------------------------------------------------
  // SUITE 11: Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL INVENTORY TESTS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
