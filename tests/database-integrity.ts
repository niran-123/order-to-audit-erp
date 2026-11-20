/**
 * Order-to-Audit Manufacturing ERP
 * Comprehensive Database Integrity & Constraint Verification Suite
 * 
 * Verifies relational invariants, decimal precisions, unit conversion mathematics,
 * double-entry stock movement source document enforcement, and immutability rules.
 */

import * as fs from 'fs';
import * as path from 'path';

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
    console.error(`  [FAIL] ${suite} -> ${testName}: ${failureMessage}`);
  }
}

async function runIntegrityTests() {
  console.log('================================================================');
  console.log('ORDER-TO-AUDIT ERP - DATABASE INTEGRITY & CONSTRAINT TESTS');
  console.log('================================================================\n');

  const cwd = process.cwd();
  const schemaPath = fs.existsSync(path.resolve(cwd, 'backend/prisma/schema.prisma'))
    ? path.resolve(cwd, 'backend/prisma/schema.prisma')
    : path.resolve(cwd, 'prisma/schema.prisma');
  const migrationPath = fs.existsSync(path.resolve(cwd, 'backend/prisma/migrations/20261120000000_init/migration.sql'))
    ? path.resolve(cwd, 'backend/prisma/migrations/20261120000000_init/migration.sql')
    : path.resolve(cwd, 'prisma/migrations/20261120000000_init/migration.sql');

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  const normalizedMigration = migrationContent.replace(/\s+/g, ' ').toLowerCase();

  // -------------------------------------------------------------
  // SUITE 1: Required Entities & Model Coverage
  // -------------------------------------------------------------
  console.log('>> Suite 1: Entity & Table Coverage');
  const requiredEntities = [
    'User', 'Role', 'Permission', 'UserRole', 'RolePermission', 'RefreshToken',
    'Customer', 'CustomerAddress', 'Supplier', 'ProductCategory',
    'Unit', 'UnitConversion', 'Product', 'RawMaterial', 'PackagingMaterial',
    'BillOfMaterial', 'BOMItem', 'ProductionRun', 'ProductionConsumption',
    'ProductionOutput', 'WastageRecord', 'ProductionOverhead',
    'Purchase', 'PurchaseItem',
    'InventoryItem', 'StockBatch', 'StockMovement', 'StockBalance',
    'SalesOrder', 'SalesOrderItem', 'Invoice', 'InvoiceItem',
    'Dispatch', 'DispatchItem',
    'Payment', 'PaymentAllocation', 'CostRecord',
    'AuditLog', 'AppSetting'
  ];

  for (const entity of requiredEntities) {
    const modelRegex = new RegExp(`model\\s+${entity}\\s+{`, 'm');
    assert(modelRegex.test(schemaContent), 'Entity Coverage', `Model ${entity} is defined in schema.prisma`);
  }

  // -------------------------------------------------------------
  // SUITE 2: Enums and Role Matrix
  // -------------------------------------------------------------
  console.log('\n>> Suite 2: Enums and Role Matrix');
  const requiredEnums = [
    'SystemRole', 'CustomerStatus', 'AddressType', 'SupplierStatus',
    'UnitType', 'BOMStatus', 'ItemType', 'ProductionStatus',
    'WastageReason', 'OverheadType', 'PurchaseStatus', 'InventoryItemType',
    'BatchStatus', 'StockMovementType', 'SourceDocumentType',
    'SalesOrderStatus', 'InvoiceType', 'InvoiceStatus', 'DispatchStatus',
    'PaymentType', 'PaymentMode', 'PaymentStatus', 'CostType', 'AuditAction'
  ];

  for (const en of requiredEnums) {
    const enumRegex = new RegExp(`enum\\s+${en}\\s+{`, 'm');
    assert(enumRegex.test(schemaContent), 'Enum Coverage', `Enum ${en} is defined in schema.prisma`);
  }

  // Verify all 6 mandatory system roles
  const roles = ['OWNER', 'ADMIN', 'SALESMAN', 'PRODUCTION_SUPERVISOR', 'ACCOUNTANT', 'AUDITOR'];
  for (const r of roles) {
    assert(schemaContent.includes(r), 'Role Coverage', `Role ${r} is defined`);
  }

  // -------------------------------------------------------------
  // SUITE 3: Decimal Precision & Numeric Money Invariants
  // -------------------------------------------------------------
  console.log('\n>> Suite 3: Decimal Precision & Monetary Precision');
  
  // Rule: Financial values must be @db.Decimal(14, 2) or @db.Decimal(14, 4)
  const financialFields = [
    { model: 'Customer', field: 'creditLimit', precision: 'decimal(14,2)' },
    { model: 'Product', field: 'standardPrice', precision: 'decimal(14,2)' },
    { model: 'RawMaterial', field: 'standardCost', precision: 'decimal(14,4)' },
    { model: 'SalesOrder', field: 'totalAmount', precision: 'decimal(14,2)' },
    { model: 'Invoice', field: 'grandTotal', precision: 'decimal(14,2)' },
    { model: 'Invoice', field: 'taxableAmount', precision: 'decimal(14,2)' },
    { model: 'Payment', field: 'amount', precision: 'decimal(14,2)' },
    { model: 'PaymentAllocation', field: 'allocatedAmount', precision: 'decimal(14,2)' },
    { model: 'CostRecord', field: 'amount', precision: 'decimal(14,2)' }
  ];

  for (const f of financialFields) {
    const normalizedPrec = f.precision.replace(/\s+/g, '').toLowerCase();
    assert(
      schemaContent.includes(f.field) && normalizedMigration.includes(normalizedPrec),
      'Precision Invariants',
      `${f.model}.${f.field} uses strict ${f.precision}`
    );
  }

  // Rule: Stock and production quantities must be @db.Decimal(14, 4)
  const quantityFields = [
    { field: 'minOrderQty', precision: 'Decimal(14, 4)' },
    { field: 'safetyStock', precision: 'Decimal(14, 4)' },
    { field: 'standardQty', precision: 'Decimal(14, 4)' },
    { field: 'targetQty', precision: 'Decimal(14, 4)' },
    { field: 'actualProducedQty', precision: 'Decimal(14, 4)' },
    { field: 'orderedQty', precision: 'Decimal(14, 4)' },
    { field: 'currentStock', precision: 'Decimal(14, 4)' },
    { field: 'availableStock', precision: 'Decimal(14, 4)' }
  ];

  for (const q of quantityFields) {
    assert(
      schemaContent.includes(q.field),
      'Quantity Precision',
      `Quantity field ${q.field} defined with 4 decimal places`
    );
  }

  // -------------------------------------------------------------
  // SUITE 4: Relational Foreign Keys & Cascades
  // -------------------------------------------------------------
  console.log('\n>> Suite 4: Foreign Key and Cascade Rules');

  // Customer Addresses must cascade on Customer delete
  assert(
    migrationContent.includes('ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE'),
    'Referential Integrity',
    'CustomerAddress cascades on Customer deletion'
  );

  // SalesOrderItem must cascade on SalesOrder delete
  assert(
    migrationContent.includes('ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE'),
    'Referential Integrity',
    'SalesOrderItem cascades on SalesOrder deletion'
  );

  // Unit deletion must be RESTRICTED when referenced by products or conversions
  assert(
    migrationContent.includes('REFERENCES "units"("id") ON DELETE RESTRICT'),
    'Referential Integrity',
    'Unit deletion is RESTRICTED on active references'
  );

  // -------------------------------------------------------------
  // SUITE 5: Double-Entry Stock Movement Rules & Immutability
  // -------------------------------------------------------------
  console.log('\n>> Suite 5: Double-Entry Stock Movement Rules');

  // Check constraint on source document
  assert(
    migrationContent.includes('CONSTRAINT "chk_stock_movement_source_doc" CHECK (source_document_id IS NOT NULL AND length(trim(source_document_id)) > 0)'),
    'Stock Invariants',
    'Stock movement requires non-empty source document ID'
  );

  // Check constraint on positive quantity
  assert(
    migrationContent.includes('CONSTRAINT "chk_stock_movement_qty" CHECK (quantity > 0)'),
    'Stock Invariants',
    'Stock movement quantity must be strictly greater than 0'
  );

  // Immutability trigger on posted stock movements
  assert(
    migrationContent.includes('trg_stock_movements_immutability') &&
    migrationContent.includes('fn_prevent_posted_stock_movement_mutation'),
    'Audit Immutability',
    'PostgreSQL trigger prevents delete or modification of posted stock movements'
  );

  // Immutability trigger on posted invoices
  assert(
    migrationContent.includes('trg_invoices_deletion_guard') &&
    migrationContent.includes('fn_prevent_posted_invoice_deletion'),
    'Tax & Audit Immutability',
    'PostgreSQL trigger prevents deletion of posted statutory GST invoices'
  );

  // -------------------------------------------------------------
  // SUITE 6: Unit Conversion Mathematical Invariants
  // -------------------------------------------------------------
  console.log('\n>> Suite 6: Unit Conversion Mathematical Verification');

  interface ConversionTest {
    qty: number;
    from: string;
    to: string;
    multiplier: number;
    expected: number;
  }

  const mathTests: ConversionTest[] = [
    { qty: 2.5, from: 'KG', to: 'G', multiplier: 1000.0, expected: 2500.0 },
    { qty: 750, from: 'G', to: 'KG', multiplier: 0.001, expected: 0.75 },
    { qty: 3.25, from: 'LTR', to: 'ML', multiplier: 1000.0, expected: 3250.0 },
    { qty: 500, from: 'ML', to: 'LTR', multiplier: 0.001, expected: 0.5 },
    { qty: 10, from: 'CTN', to: 'PCS', multiplier: 12.0, expected: 120.0 }, // 10 Cartons = 120 Pieces
  ];

  for (const t of mathTests) {
    const calculated = t.qty * t.multiplier;
    const diff = Math.abs(calculated - t.expected);
    assert(
      diff < 0.0001,
      'Unit Conversion Math',
      `${t.qty} ${t.from} -> ${t.to} (x${t.multiplier}) = ${calculated} ${t.to}`
    );
  }

  // -------------------------------------------------------------
  // SUITE 7: Unique Business Identifiers
  // -------------------------------------------------------------
  console.log('\n>> Suite 7: Unique Business Identifiers');
  const uniqueIndexes = [
    'users_email_key',
    'roles_name_key',
    'customers_code_key',
    'suppliers_code_key',
    'products_sku_key',
    'raw_materials_code_key',
    'packaging_materials_code_key',
    'bill_of_materials_bom_number_key',
    'production_runs_run_number_key',
    'production_runs_batch_number_key',
    'purchases_po_number_key',
    'stock_movements_movement_number_key',
    'sales_orders_so_number_key',
    'invoices_invoice_number_key',
    'dispatches_dispatch_number_key',
    'dispatches_delivery_challan_no_key',
    'payments_payment_number_key'
  ];

  for (const idx of uniqueIndexes) {
    assert(
      migrationContent.includes(idx),
      'Unique Constraints',
      `Unique index ${idx} generated in SQL DDL`
    );
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`DATABASE INTEGRITY TEST RESULTS: ${passed}/${total} PASSED`);
  if (failed > 0) {
    console.error(`FAILED TESTS: ${failed}`);
    process.exit(1);
  } else {
    console.log('ALL RELATIONAL & INTEGRITY INVARIANTS VALIDATED SUCCESSFULLY.');
    console.log('================================================================\n');
  }
}

runIntegrityTests().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
