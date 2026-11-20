/**
 * Payment Management, Accounts Receivable & Production Costing Test Suite
 * Order-to-Audit Manufacturing ERP
 *
 * Test Matrix:
 * 1. Benchmark Production Setup: Flour WAC ₹43.125, actual consumption & output 188 good pkts
 * 2. Benchmark Costing: Dynamic material cost ₹4,147.00 + Overheads ₹1,800.00 = ₹5,947.00
 * 3. Cost Per Good Packet: ₹5,947.00 / 188 = ₹31.6330 (Never hardcoded)
 * 4. Profitability & Margin Analytics:
 *    - Retailer Tier (₹50.00): Gross Profit ₹18.3670, Margin 36.73%
 *    - Distributor Tier (₹46.50): Gross Profit ₹14.8670, Margin 31.97%
 * 5. Benchmark Invoice: Retailer A Tax Invoice INV-2026-00101 for ₹7,875.00
 * 6. Benchmark Payment: Payment received ₹4,000.00
 * 7. Accounts Receivable Outstanding: ₹7,875.00 - ₹4,000.00 = ₹3,875.00 (Status: PARTIALLY_PAID)
 * 8. Full Settlement Payment: Second payment of ₹3,875.00 -> Status: PAID, Outstanding: ₹0.00
 * 9. Over-allocation guard: Attempting to allocate more than invoice balance is blocked
 * 10. Real-time AR Ageing Analysis: Buckets 0-30, 31-60, 61-90, >90 days
 * 11. Security Audit Logging: Payment transactions recorded in audit trail
 */

import { FinanceService } from '../backend/src/modules/finance/finance.service';
import { SalesService } from '../backend/src/modules/sales/sales.service';
import { InventoryService } from '../backend/src/modules/inventory/inventory.service';
import { PurchasesService } from '../backend/src/modules/inventory/purchases.service';
import { ProductionService } from '../backend/src/modules/production/production.service';
import { auditLogs } from '../backend/src/modules/audit/audit.service';
import { BadRequestError } from '../backend/src/utils/appError';

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
  console.log('FINANCIAL MANAGEMENT & PRODUCTION COSTING INTEGRATION SUITE');
  console.log('================================================================\n');

  // Step 0: Reset all stores to benchmark baseline
  InventoryService.resetBenchmark();
  PurchasesService.resetBenchmark();
  ProductionService.resetBenchmark();
  SalesService.resetBenchmark();
  FinanceService.resetBenchmark();

  // Baseline packaging & FG inventory setup
  const pouchState = InventoryService.getItemById('inv-pm-pouch-01');
  pouchState.openingBalance = 500.0;
  pouchState.currentStock = 500.0;

  const ctnState = InventoryService.getItemById('inv-pm-ctn-01');
  ctnState.openingBalance = 31.0;
  ctnState.currentStock = 31.0;

  const fgState = InventoryService.getItemById('inv-fg-mur-200g');
  fgState.openingBalance = 50.0;
  fgState.currentStock = 50.0;

  // Step 1: Execute Flour Purchase (60 kg @ ₹45.00/kg)
  // Opening: 100 kg @ ₹42.00, Inflow: 60 kg @ ₹45.00 -> WAC = ₹43.125/kg
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

  const flourItem = InventoryService.getItemById('inv-rm-rice-01');
  assert(
    Math.abs(flourItem.averageCost - 43.125) < 0.0001,
    'Flour weighted-average cost is exactly ₹43.125/kg'
  );

  // Step 2: Execute Production Run for 200 packets
  const murukkuBOM = ProductionService.getBOMById('bom-mur-200g-v1');
  const run = await ProductionService.createProductionRun({
    productId: murukkuBOM.productId,
    bomId: murukkuBOM.id,
    plannedOutput: 200,
    supervisorId: 'usr-supervisor-01',
    notes: 'Cost Accounting Benchmark Shift',
  });

  // Benchmark Overheads: Labour ₹1,200.00, Gas and Power ₹600.00 (Gas ₹380, Electricity ₹220)
  const completedRun = await ProductionService.completeAndPostProductionRun(run.id, {
    actualGoodOutput: 188.0,
    damagedOutput: 12.0,
    damagedPackagingQty: 6.0,
    materials: [
      { materialId: 'inv-rm-rice-01', actualQty: 40.0 }, // 40 kg flour
      { materialId: 'inv-rm-oil-01', actualQty: 10.5 }, // 10.5 L oil @ ₹125 = ₹1,312.50
      { materialId: 'inv-rm-spice-01', actualQty: 1.2 }, // 1.2 kg spices @ ₹240 = ₹288.00
      { materialId: 'inv-pm-pouch-01', actualQty: 194.0 }, // 194 pouches @ ₹2.25 = ₹436.50
      { materialId: 'inv-pm-ctn-01', actualQty: 10.0 }, // 10 cartons @ ₹38.50 = ₹385.00
    ],
    overheads: {
      labourCost: 1200.0,
      gasCost: 380.0,
      electricityCost: 220.0,
    },
    supervisorId: 'usr-supervisor-01',
  });

  assert(completedRun.output.actualGoodOutput === 188, 'Actual good output recorded as 188 packets');

  // =========================================================================
  // SECTION 1: PRODUCTION COSTING & OVERHEAD ABSORPTION
  // =========================================================================
  console.log('\n--- Section 1: Production Costing (Absorption Costing under Ind AS 2) ---');

  const costing = FinanceService.calculateProductionCosting(completedRun.id, {
    labourCost: 1200.0,
    gasPowerCost: 600.0,
  });

  // Direct Material Cost Breakdown Verification
  const flourLine = costing.directMaterialLines.find((m) => m.materialId === 'inv-rm-rice-01');
  const oilLine = costing.directMaterialLines.find((m) => m.materialId === 'inv-rm-oil-01');
  const spiceLine = costing.directMaterialLines.find((m) => m.materialId === 'inv-rm-spice-01');
  const pouchLine = costing.directMaterialLines.find((m) => m.materialId === 'inv-pm-pouch-01');
  const ctnLine = costing.directMaterialLines.find((m) => m.materialId === 'inv-pm-ctn-01');

  assert(flourLine?.totalCost === 1725.0, `Flour line cost is ₹1,725.00 (40 kg * ₹43.125) (Actual: ₹${flourLine?.totalCost})`);
  assert(oilLine?.totalCost === 1312.5, `Oil line cost is ₹1,312.50 (10.5 L * ₹125) (Actual: ₹${oilLine?.totalCost})`);
  assert(spiceLine?.totalCost === 288.0, `Spice line cost is ₹288.00 (1.2 kg * ₹240) (Actual: ₹${spiceLine?.totalCost})`);
  assert(pouchLine?.totalCost === 436.5, `Pouch line cost is ₹436.50 (194 pcs * ₹2.25) (Actual: ₹${pouchLine?.totalCost})`);
  assert(ctnLine?.totalCost === 385.0, `Carton line cost is ₹385.00 (10 pcs * ₹38.50) (Actual: ₹${ctnLine?.totalCost})`);

  // Total Material Cost: 1725 + 1312.5 + 288 + 436.5 + 385 = ₹4,147.00
  assert(costing.totalDirectMaterialCost === 4147.0, `Total direct material cost is ₹4,147.00 (Actual: ₹${costing.totalDirectMaterialCost})`);

  // Manufacturing Overheads: Labour ₹1,200 + Gas & Power ₹600 = ₹1,800.00
  assert(costing.overheads.labourCost === 1200.0, 'Allocated labour overhead is ₹1,200.00');
  assert(costing.overheads.gasPowerCost === 600.0, 'Allocated gas and power overhead is ₹600.00');
  assert(costing.overheads.totalOverheadCost === 1800.0, 'Total manufacturing overhead is ₹1,800.00');

  // Total Production Cost: ₹4,147.00 + ₹1,800.00 = ₹5,947.00
  assert(costing.totalProductionCost === 5947.0, `Total production cost is ₹5,947.00 (Actual: ₹${costing.totalProductionCost})`);

  // Unit Cost Per Good Packet: ₹5,947.00 / 188 = ₹31.6330
  // Denominator strictly actual good output (188), NOT planned output (200)!
  const expectedUnitCost = Number((5947.0 / 188).toFixed(4));
  assert(
    Math.abs(costing.costPerGoodPacket - expectedUnitCost) < 0.0001,
    `Cost per good packet is ₹${costing.costPerGoodPacket} (computed dynamically as ₹5,947.00 / 188)`
  );
  assert(costing.costPerGoodPacket !== 29.735, 'Unit cost does NOT divide by planned output (200), ensuring scrap is absorbed');

  // Scrap loss impact
  assert(costing.scrapLossImpact > 0, `Scrap loss impact is +₹${costing.scrapLossImpact}/pkt due to 12 damaged units`);

  // =========================================================================
  // SECTION 2: PROFITABILITY & GROSS MARGINS
  // =========================================================================
  console.log('\n--- Section 2: Product Profitability Across Pricing Tiers ---');

  const profitability = FinanceService.calculateProductProfitability(costing.costPerGoodPacket);

  const retailerTier = profitability.pricingTiers.find((t) => t.tierName === 'Retailer Tier');
  const distributorTier = profitability.pricingTiers.find((t) => t.tierName.includes('Distributor'));

  // Retailer Tier: Selling Price ₹50.00
  const expectedRetailerProfit = Number((50.0 - costing.costPerGoodPacket).toFixed(4));
  const expectedRetailerMargin = Number(((expectedRetailerProfit / 50.0) * 100).toFixed(2));
  assert(retailerTier?.sellingPrice === 50.0, 'Retailer tier selling price is ₹50.00/pkt');
  assert(
    Math.abs((retailerTier?.grossProfitPerPacket || 0) - expectedRetailerProfit) < 0.001,
    `Retailer gross profit is ₹${retailerTier?.grossProfitPerPacket}/pkt`
  );
  assert(
    Math.abs((retailerTier?.grossMarginPct || 0) - expectedRetailerMargin) < 0.01,
    `Retailer gross margin percentage is ${retailerTier?.grossMarginPct}%`
  );

  // Distributor Tier: Selling Price ₹46.50
  const expectedDistributorProfit = Number((46.5 - costing.costPerGoodPacket).toFixed(4));
  const expectedDistributorMargin = Number(((expectedDistributorProfit / 46.5) * 100).toFixed(2));
  assert(distributorTier?.sellingPrice === 46.5, 'Distributor wholesale selling price is ₹46.50/pkt');
  assert(
    Math.abs((distributorTier?.grossProfitPerPacket || 0) - expectedDistributorProfit) < 0.001,
    `Distributor gross profit is ₹${distributorTier?.grossProfitPerPacket}/pkt`
  );
  assert(
    Math.abs((distributorTier?.grossMarginPct || 0) - expectedDistributorMargin) < 0.01,
    `Distributor gross margin percentage is ${distributorTier?.grossMarginPct}%`
  );

  // =========================================================================
  // SECTION 3: INVOICE GENERATION & BENCHMARK PAYMENT (PART A & E)
  // =========================================================================
  console.log('\n--- Section 3: Benchmark Payment & Invoice Allocation ---');

  // Create & Approve Order for Retailer A (150 pkts @ ₹50.00 = Taxable ₹7,500 + GST ₹375 = ₹7,875.00)
  const orderA = await SalesService.createOrder(
    {
      customerId: 'cust-retailer-a',
      items: [{ productId: 'inv-fg-mur-200g', orderedQty: 150 }],
    },
    { userId: 'sales-001', email: 'sales@enterprise.com' }
  );

  await SalesService.approveOrder(orderA.id, { userId: 'admin-001', email: 'admin@enterprise.com' });

  // Generate GST Tax Invoice for Retailer A
  const invoiceA = await SalesService.generateInvoice(orderA.id, {
    userId: 'acc-001',
    email: 'accountant@enterprise.com',
  });

  assert(invoiceA.invoiceNumber === 'INV-2026-00101', 'Retailer A invoice allocated INV-2026-00101');
  assert(invoiceA.grandTotal === 7875.0, `Invoice grand total is ₹7,875.00 (Actual: ₹${invoiceA.grandTotal})`);
  assert(invoiceA.paidAmount === 0, 'Invoice initial paidAmount is ₹0.00');
  assert(invoiceA.status === 'POSTED', 'Invoice initial status is POSTED');

  // Benchmark Test Part E:
  // Retailer A invoice: ₹7,875.
  // Payment received: ₹4,000.
  // Outstanding: ₹3,875.
  const payment1 = await FinanceService.recordPayment(
    {
      customerId: 'cust-retailer-a',
      invoiceId: invoiceA.id,
      amount: 4000.0,
      paymentMethod: 'NEFT',
      referenceNumber: 'HDFCR52026112001',
      bankName: 'HDFC Bank Ltd',
      notes: 'Part-payment against festival order',
    },
    { userId: 'acc-001', email: 'accountant@enterprise.com' }
  );

  assert(payment1.paymentNumber === 'PAY-2026-00101', 'Payment receipt PAY-2026-00101 generated');
  assert(payment1.amount === 4000.0, 'Payment amount recorded as ₹4,000.00');
  assert(payment1.allocatedAmount === 4000.0, 'Allocated amount is ₹4,000.00');
  assert(payment1.unallocatedAmount === 0, 'Unallocated amount is ₹0.00');
  assert(payment1.allocations.length === 1, 'Payment linked to 1 invoice allocation');
  assert(payment1.allocations[0].invoiceNumber === 'INV-2026-00101', 'Allocation points to INV-2026-00101');

  // Verify Invoice State after Part-Payment
  const invoiceAfterPayment1 = SalesService.getInvoiceById(invoiceA.id);
  assert(invoiceAfterPayment1.paidAmount === 4000.0, `Invoice paidAmount is updated to ₹4,000.00 (Actual: ₹${invoiceAfterPayment1.paidAmount})`);
  assert(invoiceAfterPayment1.status === 'PARTIALLY_PAID', 'Invoice status updated to PARTIALLY_PAID');

  const outstandingBalance1 = Number((invoiceAfterPayment1.grandTotal - invoiceAfterPayment1.paidAmount).toFixed(2));
  assert(
    outstandingBalance1 === 3875.0,
    `Benchmark Outstanding Balance is ₹3,875.00 (₹7,875.00 - ₹4,000.00) (Actual: ₹${outstandingBalance1})`
  );

  // =========================================================================
  // SECTION 4: OVER-ALLOCATION PREVENTION GUARD
  // =========================================================================
  console.log('\n--- Section 4: Over-Allocation Security Guard ---');

  // Attempt to allocate ₹5,000 against an invoice with only ₹3,875 outstanding
  let overAllocationBlocked = false;
  try {
    await FinanceService.recordPayment(
      {
        customerId: 'cust-retailer-a',
        amount: 5000.0,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'UTR-OVERALLOC-TEST',
        allocations: [{ invoiceId: invoiceA.id, amount: 5000.0 }],
      },
      { userId: 'acc-001', email: 'accountant@enterprise.com' }
    );
  } catch (err: any) {
    if (err instanceof BadRequestError && err.message.includes('exceeds invoice')) {
      overAllocationBlocked = true;
    }
  }
  assert(overAllocationBlocked, 'Over-allocation exceeding invoice outstanding balance is strictly BLOCKED');

  // =========================================================================
  // SECTION 5: FINAL SETTLEMENT PAYMENT (FULL RECONCILIATION)
  // =========================================================================
  console.log('\n--- Section 5: Full Settlement & Status Transition ---');

  // Record second payment for remaining ₹3,875.00
  const payment2 = await FinanceService.recordPayment(
    {
      customerId: 'cust-retailer-a',
      invoiceId: invoiceA.id,
      amount: 3875.0,
      paymentMethod: 'RTGS',
      referenceNumber: 'RTGS-2026-SETTLE-002',
      bankName: 'State Bank of India',
      notes: 'Final settlement of INV-2026-00101 balance',
    },
    { userId: 'acc-001', email: 'accountant@enterprise.com' }
  );

  assert(payment2.allocatedAmount === 3875.0, 'Second payment allocated ₹3,875.00');

  const invoiceAfterPayment2 = SalesService.getInvoiceById(invoiceA.id);
  assert(invoiceAfterPayment2.paidAmount === 7875.0, 'Invoice paidAmount is now full ₹7,875.00');
  assert(invoiceAfterPayment2.status === 'PAID', 'Invoice status transitioned to PAID');

  const outstandingBalance2 = Number((invoiceAfterPayment2.grandTotal - invoiceAfterPayment2.paidAmount).toFixed(2));
  assert(outstandingBalance2 === 0, 'Invoice outstanding balance is now exactly ₹0.00');

  // =========================================================================
  // SECTION 6: ACCOUNTS RECEIVABLE & AGEING ANALYSIS (PART B)
  // =========================================================================
  console.log('\n--- Section 6: Accounts Receivable & Ageing Analysis ---');

  // Create an unpaid invoice for Distributor B to test receivables & ageing
  const orderB = await SalesService.createOrder(
    {
      customerId: 'cust-distributor-b',
      items: [{ productId: 'inv-fg-mur-200g', orderedQty: 50 }],
    },
    { userId: 'sales-001', email: 'sales@enterprise.com' }
  );
  await SalesService.approveOrder(orderB.id, { userId: 'admin-001', email: 'admin@enterprise.com' });
  const invoiceB = await SalesService.generateInvoice(orderB.id, {
    userId: 'acc-001',
    email: 'accountant@enterprise.com',
  });

  const arSummary = FinanceService.getAccountsReceivable();

  assert(arSummary.totalInvoiced === 7875.0 + invoiceB.grandTotal, 'Total invoiced sum includes all posted invoices');
  assert(arSummary.totalCollected === 7875.0, 'Total collected equals ₹7,875.00 from Retailer A');
  assert(arSummary.totalReceivables === invoiceB.grandTotal, `Total receivables equals unpaid Distributor B invoice (₹${invoiceB.grandTotal})`);
  assert(arSummary.paidInvoicesCount === 1, 'Paid invoices count is 1 (Retailer A fully settled)');
  assert(arSummary.unpaidInvoicesCount === 1, 'Unpaid invoices count is 1 (Distributor B)');

  // Ageing Buckets Verification
  assert(arSummary.ageingAnalysis.bucket0_30.count === 1, 'Current invoices mapped to 0–30 days ageing category');
  assert(arSummary.ageingAnalysis.bucket0_30.amount === invoiceB.grandTotal, '0–30 days outstanding matches Distributor B balance');

  // Customer Breakdown Verification
  const retailerARec = arSummary.customerBreakdown.find((c) => c.customerId === 'cust-retailer-a');
  assert(retailerARec?.outstandingAmount === 0, 'Retailer A outstanding balance in AR ledger is ₹0.00');
  assert(retailerARec?.status === 'CLEAR', 'Retailer A account status is CLEAR');

  const distributorBRec = arSummary.customerBreakdown.find((c) => c.customerId === 'cust-distributor-b');
  assert(distributorBRec?.outstandingAmount === invoiceB.grandTotal, 'Distributor B outstanding balance equals invoice amount');

  // =========================================================================
  // SECTION 7: AUDIT TRAIL LOGGING
  // =========================================================================
  console.log('\n--- Section 7: Audit Trail Verification ---');

  const paymentAudits = auditLogs.filter((a) => a.entityName === 'PAYMENT');
  assert(paymentAudits.length >= 2, 'Customer payments audited in security audit trail');

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution failure:', err);
  process.exit(1);
});
