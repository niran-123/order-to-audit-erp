/**
 * Order-to-Audit Manufacturing ERP
 * Comprehensive BOM & Production Management Verification Suite
 * 
 * Verifies:
 * 1. BOM Management & Material Requirement Calculation
 * 2. Production Run Lifecycle (Planned -> Completed)
 * 3. Pre-execution Inventory Availability Validation (Insufficient RM & PM)
 * 4. Unit Conversion Integration (KG <-> G, LTR <-> ML, CTN <-> PKT)
 * 5. Production Cancellation Rules
 * 6. Duplicate Production Posting Prevention
 * 7. Variance Calculations:
 *    - Yield Variance: ((188 - 200) / 200) * 100 = -6.0% (Alert)
 *    - Oil Variance: ((10.5 - 10) / 10) * 100 = +5.0% (Alert)
 * 8. Automatic Atomic Stock Updates & Stock Ledger Linkage
 * 9. Security Audit Logging
 * 10. The Benchmark Scenario:
 *    - Flour: 120 kg closing
 *    - Oil: 19.5 litres closing
 *    - Spice mix: 3.8 kg closing
 *    - Pouches: 306 pieces closing
 *    - Cartons: 21 pieces closing
 *    - Finished murukku: 238 packets after production
 */

import { ProductionService, productionStore } from '../backend/src/modules/production/production.service';
import { InventoryService, inventoryStore } from '../backend/src/modules/inventory/inventory.service';
import { PurchasesService } from '../backend/src/modules/inventory/purchases.service';
import { UnitConversionUtil } from '../backend/src/modules/production/unit-conversion.util';

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

async function runProductionTests() {
  console.log('================================================================');
  console.log('ORDER-TO-AUDIT ERP - PRODUCTION & BOM VERIFICATION SUITE');
  console.log('================================================================\n');

  // Reset all stores
  InventoryService.resetBenchmark();
  PurchasesService.resetBenchmark();
  ProductionService.resetBenchmark();

  // -------------------------------------------------------------
  // SUITE 1: BOM Management & Requirement Calculations
  // -------------------------------------------------------------
  console.log('>> Suite 1: BOM Management & Material Requirement Calculations');
  const boms = ProductionService.listBOMs();
  assert(boms.length >= 1, 'BOM Module', 'Default Murukku BOM loaded');

  const murukkuBOM = ProductionService.getBOMById('bom-mur-200g-v1');
  assert(murukkuBOM.productCode === 'PRD-MUR-200G', 'BOM Module', 'BOM links to Traditional Crunchy Murukku 200g');
  assert(murukkuBOM.batchSize === 200, 'BOM Module', 'BOM batch size is 200 packets');
  assert(murukkuBOM.expectedOutput === 200, 'BOM Module', 'Expected output is 200 packets');

  // Verify ingredient standards for 200 packets
  const flourItem = murukkuBOM.items.find((i) => i.materialCode === 'RM-RICE-01');
  const oilItem = murukkuBOM.items.find((i) => i.materialCode === 'RM-OIL-01');
  const spiceItem = murukkuBOM.items.find((i) => i.materialCode === 'RM-SPICE-01');
  const pouchItem = murukkuBOM.items.find((i) => i.materialCode === 'PM-POUCH-MUR-200');
  const ctnItem = murukkuBOM.items.find((i) => i.materialCode === 'PM-CTN-MUR-50');

  assert(flourItem?.standardQty === 40.0 && flourItem.unitCode === 'KG', 'BOM Module', 'Flour standard is 40 kg');
  assert(oilItem?.standardQty === 10.0 && oilItem.unitCode === 'LTR', 'BOM Module', 'Oil standard is 10 litres');
  assert(spiceItem?.standardQty === 1.2 && spiceItem.unitCode === 'KG', 'BOM Module', 'Spice mix standard is 1.2 kg');
  assert(pouchItem?.standardQty === 200.0 && pouchItem.unitCode === 'PCS', 'BOM Module', 'Pouches standard is 200 pieces');
  assert(ctnItem?.standardQty === 10.0 && ctnItem.unitCode === 'PCS', 'BOM Module', 'Cartons standard is 10 pieces');

  // Scaling test: Scale to 400 packets (2 batches)
  const scaledReqs = ProductionService.calculateMaterialRequirements(murukkuBOM.id, 400);
  const scaledFlour = scaledReqs.find((r) => r.materialCode === 'RM-RICE-01');
  const scaledOil = scaledReqs.find((r) => r.materialCode === 'RM-OIL-01');
  assert(scaledFlour?.plannedQty === 80.0, 'Requirement Calculation', '400 packets scales flour to 80 kg');
  assert(scaledOil?.plannedQty === 20.0, 'Requirement Calculation', '400 packets scales oil to 20 litres');

  // -------------------------------------------------------------
  // SUITE 2: Unit Conversion Engine Verification
  // -------------------------------------------------------------
  console.log('\n>> Suite 2: Unit Conversion Engine Verification');
  // KG <-> G
  const gFromKg = UnitConversionUtil.convert(2.5, 'KG', 'G');
  assert(gFromKg === 2500, 'Unit Conversion', '2.5 KG converts to 2500 G');

  const kgFromG = UnitConversionUtil.convert(1200, 'G', 'KG');
  assert(kgFromG === 1.2, 'Unit Conversion', '1200 G converts to 1.2 KG');

  // LTR <-> ML
  const mlFromLtr = UnitConversionUtil.convert(10.5, 'LTR', 'ML');
  assert(mlFromLtr === 10500, 'Unit Conversion', '10.5 LTR converts to 10500 ML');

  const ltrFromMl = UnitConversionUtil.convert(750, 'ML', 'LTR');
  assert(ltrFromMl === 0.75, 'Unit Conversion', '750 ML converts to 0.75 LTR');

  // Cartons <-> Packets
  const pktsFromCtn = UnitConversionUtil.convert(10, 'CTN', 'PKT');
  assert(pktsFromCtn === 200, 'Unit Conversion', '10 Cartons converts to 200 Packets');

  // Unsupported conversion test
  let invalidConversionCaught = false;
  try {
    UnitConversionUtil.convert(10, 'KG', 'LTR');
  } catch (err: any) {
    invalidConversionCaught = true;
    assert(err.message.includes('Unsupported unit conversion'), 'Unit Conversion', 'Incompatible conversion rejected');
  }
  assert(invalidConversionCaught, 'Unit Conversion', 'Incompatible unit conversion throws BadRequestError');

  // -------------------------------------------------------------
  // SUITE 3: Production Run Scheduling
  // -------------------------------------------------------------
  console.log('\n>> Suite 3: Production Run Scheduling');
  const run = await ProductionService.createProductionRun({
    productId: murukkuBOM.productId,
    bomId: murukkuBOM.id,
    plannedOutput: 200,
    supervisorId: 'usr-supervisor-01',
    supervisorName: 'M. Senthil (Production Supervisor)',
    notes: 'Morning shift continuous deep fry & packaging run',
  });

  assert(run.status === 'PLANNED', 'Production Run', 'Initial status is PLANNED');
  assert(run.runNumber.startsWith('RUN-2026-'), 'Production Run', `Run number assigned: ${run.runNumber}`);
  assert(run.materials.length === 5, 'Production Run', 'Run inherits 5 material requirement lines');
  assert(run.output.plannedOutput === 200, 'Production Run', 'Planned output is 200 packets');

  // -------------------------------------------------------------
  // SUITE 4: Pre-Execution Stock Availability Validation
  // -------------------------------------------------------------
  console.log('\n>> Suite 4: Pre-Execution Stock Availability Validation');

  // Test 4A: Insufficient Raw Material
  let insufficientRMCaught = false;
  try {
    // Attempt to complete run requesting 5000 kg flour when only 100 kg is in stock
    await ProductionService.completeAndPostProductionRun(run.id, {
      actualGoodOutput: 200,
      materials: [
        { materialId: 'inv-rm-rice-01', actualQty: 5000.0 }, // Exceeds available
        { materialId: 'inv-rm-oil-01', actualQty: 10.0 },
        { materialId: 'inv-rm-spice-01', actualQty: 1.2 },
        { materialId: 'inv-pm-pouch-01', actualQty: 200.0 },
        { materialId: 'inv-pm-ctn-01', actualQty: 10.0 },
      ],
      supervisorId: 'usr-supervisor-01',
    });
  } catch (err: any) {
    insufficientRMCaught = true;
    assert(
      err.message.includes('Insufficient inventory for Raw Material'),
      'Stock Validation',
      `Insufficient raw material blocked: "${err.message}"`
    );
  }
  assert(insufficientRMCaught, 'Stock Validation', 'System blocks production if raw material is insufficient');

  // Test 4B: Insufficient Packaging Material
  let insufficientPMCaught = false;
  try {
    // Attempt to complete run requesting 99999 master cartons
    await ProductionService.completeAndPostProductionRun(run.id, {
      actualGoodOutput: 200,
      materials: [
        { materialId: 'inv-rm-rice-01', actualQty: 40.0 },
        { materialId: 'inv-rm-oil-01', actualQty: 10.0 },
        { materialId: 'inv-rm-spice-01', actualQty: 1.2 },
        { materialId: 'inv-pm-pouch-01', actualQty: 200.0 },
        { materialId: 'inv-pm-ctn-01', actualQty: 99999.0 }, // Exceeds cartons
      ],
      supervisorId: 'usr-supervisor-01',
    });
  } catch (err: any) {
    insufficientPMCaught = true;
    assert(
      err.message.includes('Insufficient inventory for Packaging Material'),
      'Stock Validation',
      `Insufficient packaging blocked: "${err.message}"`
    );
  }
  assert(insufficientPMCaught, 'Stock Validation', 'System blocks production if packaging material is insufficient');

  // -------------------------------------------------------------
  // SUITE 5: Production Run Cancellation
  // -------------------------------------------------------------
  console.log('\n>> Suite 5: Production Run Cancellation');
  const cancelTestRun = await ProductionService.createProductionRun({
    productId: murukkuBOM.productId,
    bomId: murukkuBOM.id,
    plannedOutput: 100,
    supervisorId: 'usr-supervisor-01',
  });

  const cancelled = await ProductionService.cancelProductionRun(cancelTestRun.id);
  assert(cancelled.status === 'CANCELLED', 'Cancellation', 'Planned run cancelled successfully');

  let cannotPostCancelled = false;
  try {
    await ProductionService.completeAndPostProductionRun(cancelled.id, {
      actualGoodOutput: 100,
      materials: [
        { materialId: 'inv-rm-rice-01', actualQty: 20.0 },
        { materialId: 'inv-rm-oil-01', actualQty: 5.0 },
        { materialId: 'inv-rm-spice-01', actualQty: 0.6 },
        { materialId: 'inv-pm-pouch-01', actualQty: 100.0 },
        { materialId: 'inv-pm-ctn-01', actualQty: 5.0 },
      ],
      supervisorId: 'usr-supervisor-01',
    });
  } catch (err: any) {
    cannotPostCancelled = true;
  }
  assert(cannotPostCancelled, 'Cancellation', 'Posting cancelled run is blocked');

  // =============================================================
  // SUITE 6: THE BENCHMARK SCENARIO (Dynamic End-to-End Execution)
  // =============================================================
  console.log('\n>> Suite 6: THE BENCHMARK SCENARIO');
  /**
   * Benchmark Initial Inventory Setup:
   * 1. Flour:
   *    Opening stock = 100 kg.
   *    Purchase = 60 kg (via PO and confirmed GRN).
   *    Total before run = 160 kg.
   * 2. Oil:
   *    Stock before run = 30.0 litres.
   * 3. Spice mix:
   *    Stock before run = 5.0 kg.
   * 4. Pouches:
   *    Stock before run = 500 pieces.
   * 5. Cartons:
   *    Stock before run = 31 pieces.
   * 6. Finished murukku:
   *    Stock before run = 50 packets.
   */

  // Reset stores for clean benchmark execution
  InventoryService.resetBenchmark();
  PurchasesService.resetBenchmark();
  ProductionService.resetBenchmark();

  // Setup Oil to 30.0 LTR
  const oilItemState = InventoryService.getItemById('inv-rm-oil-01');
  oilItemState.openingBalance = 30.0;
  oilItemState.currentStock = 30.0;
  oilItemState.totalValuation = 30.0 * oilItemState.averageCost;

  // Setup Spice mix to 5.0 KG
  const spiceItemState = InventoryService.getItemById('inv-rm-spice-01');
  spiceItemState.openingBalance = 5.0;
  spiceItemState.currentStock = 5.0;
  spiceItemState.totalValuation = 5.0 * spiceItemState.averageCost;

  // Setup Pouches to 500 PCS
  const pouchItemState = InventoryService.getItemById('inv-pm-pouch-01');
  pouchItemState.openingBalance = 500.0;
  pouchItemState.currentStock = 500.0;
  pouchItemState.totalValuation = 500.0 * pouchItemState.averageCost;

  // Setup Cartons to 31 PCS
  const ctnItemState = InventoryService.getItemById('inv-pm-ctn-01');
  ctnItemState.openingBalance = 31.0;
  ctnItemState.currentStock = 31.0;
  ctnItemState.totalValuation = 31.0 * ctnItemState.averageCost;

  // Setup Finished Murukku to 50 PKT
  const fgItemState = InventoryService.getItemById('inv-fg-mur-200g');
  fgItemState.openingBalance = 50.0;
  fgItemState.currentStock = 50.0;
  fgItemState.totalValuation = 50.0 * fgItemState.averageCost;

  // Step 1: Flour Purchase Entry (60 kg @ ₹45.00/kg)
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

  // Step 2: Confirm Flour Purchase & Inflow (GRN)
  await PurchasesService.confirmPurchase({
    purchaseId: flourPO.id,
    supplierInvoiceNumber: 'CAUV/2026/7821',
    confirmedBy: 'usr-supervisor-01',
  });

  // Verify Flour Stock Before Run is Exactly 160 kg
  const flourBeforeRun = InventoryService.getItemById('inv-rm-rice-01');
  assert(flourBeforeRun.currentStock === 160.0, 'Benchmark Setup', 'Flour stock before run is 160 kg (100 opening + 60 purchase)');
  assert(
    Math.abs(flourBeforeRun.averageCost - 43.125) < 0.0001,
    'Benchmark Setup',
    'Flour weighted average cost is exactly ₹43.125/kg'
  );

  // Step 3: Create Production Run for 200 packets
  const benchmarkRun = await ProductionService.createProductionRun({
    productId: murukkuBOM.productId,
    bomId: murukkuBOM.id,
    plannedOutput: 200,
    supervisorId: 'usr-supervisor-01',
    notes: 'Benchmark Shift Run - Murukku 200g',
  });

  assert(benchmarkRun.output.plannedOutput === 200, 'Benchmark Run', 'Planned output is 200 packets');

  // Step 4: Complete & Post Production Run with Benchmark Values
  // - Expected output: 200 packets
  // - Actual output: 188 packets
  // - Damaged packets: 12
  // - Damaged packaging: 6 pouches
  // - Flour: 40 kg
  // - Oil: 10.5 litres (expected 10)
  // - Spice mix: 1.2 kg
  // - Pouches: 194 pieces total (188 good + 6 damaged)
  // - Cartons: 10 pieces
  // - Labour: ₹450, Gas: ₹280, Electricity: ₹160
  const completedRun = await ProductionService.completeAndPostProductionRun(benchmarkRun.id, {
    actualGoodOutput: 188.0,
    damagedOutput: 12.0,
    damagedPackagingQty: 6.0,
    materials: [
      { materialId: 'inv-rm-rice-01', actualQty: 40.0 }, // 40 kg flour
      { materialId: 'inv-rm-oil-01', actualQty: 10.5 }, // 10.5 L oil (+5% variance)
      { materialId: 'inv-rm-spice-01', actualQty: 1.2 }, // 1.2 kg spice mix
      { materialId: 'inv-pm-pouch-01', actualQty: 194.0 }, // 188 good + 6 damaged = 194 pouches
      { materialId: 'inv-pm-ctn-01', actualQty: 10.0 }, // 10 master cartons
    ],
    overheads: {
      labourCost: 450.0,
      gasCost: 280.0,
      electricityCost: 160.0,
    },
    supervisorId: 'usr-supervisor-01',
  });

  assert(completedRun.status === 'COMPLETED', 'Benchmark Post', 'Production run posted to COMPLETED');
  assert(completedRun.output.actualGoodOutput === 188.0, 'Benchmark Post', 'Actual good output is 188 packets');

  // -------------------------------------------------------------
  // SUITE 7: Variance Calculations & Alerts Verification
  // -------------------------------------------------------------
  console.log('\n>> Suite 7: Variance Calculations & Alerts Verification');
  // 1. Yield Variance: ((188 - 200) / 200) * 100 = -6%
  const expectedYieldVariance = -6.0;
  assert(
    Math.abs(completedRun.output.yieldVariancePct - expectedYieldVariance) < 0.01,
    'Variance Engine',
    `Yield variance is exactly ${completedRun.output.yieldVariancePct}% (Expected: -6%)`
  );
  assert(completedRun.output.isYieldAlert === true, 'Variance Engine', 'Yield alert is flagged (|-6%| > 3%)');

  // 2. Oil Consumption Variance: ((10.5 - 10) / 10) * 100 = +5%
  const oilConsumption = completedRun.materials.find((m) => m.materialCode === 'RM-OIL-01');
  const expectedOilVariance = 5.0;
  assert(
    oilConsumption !== undefined && Math.abs(oilConsumption.variancePct - expectedOilVariance) < 0.01,
    'Variance Engine',
    `Oil consumption variance is exactly +${oilConsumption?.variancePct}% (Expected: +5%)`
  );
  assert(oilConsumption?.isVarianceAlert === true, 'Variance Engine', 'Oil consumption alert is flagged (|5%| > 3%)');

  // Verify Alerts Array
  const yieldAlert = completedRun.varianceAlerts.find((a) => a.type === 'YIELD');
  const oilAlert = completedRun.varianceAlerts.find((a) => a.type === 'CONSUMPTION' && a.itemCode === 'RM-OIL-01');
  assert(yieldAlert !== undefined, 'Variance Alerts', 'Yield alert object created');
  assert(oilAlert !== undefined, 'Variance Alerts', 'Oil consumption alert object created');

  // -------------------------------------------------------------
  // SUITE 8: EXACT BENCHMARK CLOSING INVENTORY VERIFICATION
  // -------------------------------------------------------------
  console.log('\n>> Suite 8: EXACT BENCHMARK CLOSING INVENTORY VERIFICATION');

  const flourClosing = InventoryService.getItemById('inv-rm-rice-01');
  const oilClosing = InventoryService.getItemById('inv-rm-oil-01');
  const spiceClosing = InventoryService.getItemById('inv-rm-spice-01');
  const pouchClosing = InventoryService.getItemById('inv-pm-pouch-01');
  const ctnClosing = InventoryService.getItemById('inv-pm-ctn-01');
  const fgClosing = InventoryService.getItemById('inv-fg-mur-200g');

  console.log('  --- Benchmark Closing Balances ---');
  console.log(`  Flour:            ${flourClosing.currentStock} kg (Target: 120 kg)`);
  console.log(`  Oil:              ${oilClosing.currentStock} litres (Target: 19.5 litres)`);
  console.log(`  Spice mix:        ${spiceClosing.currentStock} kg (Target: 3.8 kg)`);
  console.log(`  Pouches:          ${pouchClosing.currentStock} pieces (Target: 306 pieces)`);
  console.log(`  Cartons:          ${ctnClosing.currentStock} pieces (Target: 21 pieces)`);
  console.log(`  Finished murukku: ${fgClosing.currentStock} packets (Target: 238 packets)`);
  console.log('  ----------------------------------');

  // 1. Flour: 120 kg closing
  assert(flourClosing.currentStock === 120.0, 'Benchmark Target', 'Flour closing is exactly 120 kg (160 - 40)');

  // 2. Oil: 19.5 litres closing
  assert(oilClosing.currentStock === 19.5, 'Benchmark Target', 'Oil closing is exactly 19.5 litres (30 - 10.5)');

  // 3. Spice mix: 3.8 kg closing
  assert(spiceClosing.currentStock === 3.8, 'Benchmark Target', 'Spice mix closing is exactly 3.8 kg (5.0 - 1.2)');

  // 4. Pouches: 306 pieces closing
  assert(pouchClosing.currentStock === 306.0, 'Benchmark Target', 'Pouches closing is exactly 306 pieces (500 - 194)');

  // 5. Cartons: 21 pieces closing
  assert(ctnClosing.currentStock === 21.0, 'Benchmark Target', 'Cartons closing is exactly 21 pieces (31 - 10)');

  // 6. Finished murukku: 238 packets after production
  assert(fgClosing.currentStock === 238.0, 'Benchmark Target', 'Finished murukku closing is exactly 238 packets (50 + 188)');

  // -------------------------------------------------------------
  // SUITE 9: Duplicate Posting Prevention
  // -------------------------------------------------------------
  console.log('\n>> Suite 9: Duplicate Posting Prevention');
  let duplicatePostBlocked = false;
  try {
    await ProductionService.completeAndPostProductionRun(benchmarkRun.id, {
      actualGoodOutput: 188.0,
      materials: [
        { materialId: 'inv-rm-rice-01', actualQty: 40.0 },
      ],
      supervisorId: 'usr-supervisor-01',
    });
  } catch (err: any) {
    duplicatePostBlocked = true;
    assert(
      err.message.includes('already been completed and posted'),
      'Duplicate Posting',
      `Duplicate posting rejected: "${err.message}"`
    );
  }
  assert(duplicatePostBlocked, 'Duplicate Posting', 'Duplicate posting of completed production run is strictly rejected');

  // -------------------------------------------------------------
  // SUITE 10: Stock Ledger Audit Trail & Production Run Linkage
  // -------------------------------------------------------------
  console.log('\n>> Suite 10: Stock Ledger Audit Trail & Production Run Linkage');
  const ledgerEntries = InventoryService.getStockLedger({ limit: 50 });
  const runMovements = ledgerEntries.items.filter((e) => e.sourceDocumentId === benchmarkRun.runNumber);

  assert(runMovements.length >= 4, 'Stock Ledger', `Production run ${benchmarkRun.runNumber} linked to ${runMovements.length} ledger movements`);

  // Verify FG_RECEIPT movement
  const fgReceipt = runMovements.find((e) => e.movementType === 'FG_RECEIPT');
  assert(fgReceipt !== undefined, 'Stock Ledger', 'FG_RECEIPT movement created');
  assert(fgReceipt?.quantityIn === 188.0, 'Stock Ledger', 'FG_RECEIPT added exactly 188 good packets');
  assert(fgReceipt?.runningBalance === 238.0, 'Stock Ledger', 'FG running balance in ledger is 238 packets');

  // Verify PRODUCTION_ISSUE movements
  const flourIssue = runMovements.find((e) => e.movementType === 'PRODUCTION_ISSUE' && e.itemCode === 'RM-RICE-01');
  assert(flourIssue?.quantityOut === 40.0, 'Stock Ledger', 'Flour PRODUCTION_ISSUE movement recorded 40 kg out');
  assert(flourIssue?.runningBalance === 120.0, 'Stock Ledger', 'Flour running balance in ledger is 120 kg');

  const oilIssue = runMovements.find((e) => e.movementType === 'PRODUCTION_ISSUE' && e.itemCode === 'RM-OIL-01');
  assert(oilIssue?.quantityOut === 10.5, 'Stock Ledger', 'Oil PRODUCTION_ISSUE movement recorded 10.5 litres out');
  assert(oilIssue?.runningBalance === 19.5, 'Stock Ledger', 'Oil running balance in ledger is 19.5 litres');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL PRODUCTION TESTS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
