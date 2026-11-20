/**
 * Order-to-Audit Manufacturing ERP
 * Database Seed Script
 * 
 * Populates initial master data, RBAC roles/permissions, units & conversions,
 * products, raw materials, packaging materials, BOMs, customers, suppliers,
 * and initial system configuration settings.
 */

import { PrismaClient, SystemRole, UnitType, ItemType, BOMStatus, CustomerStatus, SupplierStatus, InventoryItemType, BatchStatus, StockMovementType, SourceDocumentType, AddressType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. SYSTEM ROLES
  console.log('1. Seeding Roles...');
  const rolesData = [
    { name: SystemRole.OWNER, description: 'Executive Business Owner with full financial and operational authority' },
    { name: SystemRole.ADMIN, description: 'System Administrator with configuration and user access control' },
    { name: SystemRole.SALESMAN, description: 'Field Sales Representative for order capture and customer lookup' },
    { name: SystemRole.PRODUCTION_SUPERVISOR, description: 'Shop-Floor Supervisor for work order execution, routing, and yield logging' },
    { name: SystemRole.ACCOUNTANT, description: 'Financial Controller for 3-way matching, GST invoicing, and payments' },
    { name: SystemRole.AUDITOR, description: 'Compliance Officer for forensic audit logs, stock reconciliation, and period locks' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, isSystem: true },
    });
    roleMap[r.name] = role.id;
  }

  // 2. INITIAL PERMISSIONS
  console.log('2. Seeding Permissions...');
  const permissionsData = [
    { code: 'user:manage', module: 'AUTH', description: 'Create and manage system users and roles' },
    { code: 'order:create', module: 'SALES', description: 'Create and draft sales orders' },
    { code: 'order:approve', module: 'SALES', description: 'Approve sales orders and override credit limits' },
    { code: 'bom:manage', module: 'PRODUCTION', description: 'Author and approve Bill of Materials' },
    { code: 'production:execute', module: 'PRODUCTION', description: 'Start, log consumption, and complete work orders' },
    { code: 'stock:move', module: 'INVENTORY', description: 'Perform stock movements and material issuances' },
    { code: 'invoice:post', module: 'FINANCE', description: 'Issue and post statutory GST invoices' },
    { code: 'payment:record', module: 'FINANCE', description: 'Record and allocate customer and supplier payments' },
    { code: 'audit:view', module: 'AUDIT', description: 'Inspect immutable audit logs and variance reports' },
    { code: 'audit:lock_period', module: 'AUDIT', description: 'Execute month-end stock lockout and freeze transactions' },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }

  // 3. INITIAL USERS (One per persona for testing & demo)
  console.log('3. Seeding Users with bcrypt hash...');
  const dummyPasswordHash = '$2b$10$PGSET31hlag/CsPS.bSBvu8G5bS0siOMSlV0N/E5bSjnyX/oh/leG'; // bcrypt for DemoPass@2026

  const usersData = [
    { email: 'owner@enterprise.com', firstName: 'Vikram', lastName: 'Singhania', phone: '+91 98200 11001', role: SystemRole.OWNER },
    { email: 'admin@enterprise.com', firstName: 'Anita', lastName: 'Deshmukh', phone: '+91 98200 11002', role: SystemRole.ADMIN },
    { email: 'sales@enterprise.com', firstName: 'Rohan', lastName: 'Verma', phone: '+91 98200 11003', role: SystemRole.SALESMAN },
    { email: 'production@enterprise.com', firstName: 'Rajesh', lastName: 'Sharma', phone: '+91 98200 11004', role: SystemRole.PRODUCTION_SUPERVISOR },
    { email: 'accounts@enterprise.com', firstName: 'Sunil', lastName: 'Patel', phone: '+91 98200 11005', role: SystemRole.ACCOUNTANT },
    { email: 'auditor@enterprise.com', firstName: 'Arvind', lastName: 'Mehta', phone: '+91 98200 11006', role: SystemRole.AUDITOR },
  ];

  const userMap: Record<string, string> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: {
        email: u.email,
        passwordHash: dummyPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        isActive: true,
      },
    });
    userMap[u.role] = user.id;

    // Assign Role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleMap[u.role],
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roleMap[u.role],
      },
    });
  }

  // 4. UNITS OF MEASURE
  console.log('4. Seeding Units of Measure (kg, g, ltr, ml, pcs, pkt, ctn)...');
  const unitsData = [
    { code: 'KG', name: 'Kilogram', symbol: 'kg', unitType: UnitType.WEIGHT, isBaseUnit: true },
    { code: 'G', name: 'Gram', symbol: 'g', unitType: UnitType.WEIGHT, isBaseUnit: false },
    { code: 'LTR', name: 'Litre', symbol: 'L', unitType: UnitType.VOLUME, isBaseUnit: true },
    { code: 'ML', name: 'Millilitre', symbol: 'ml', unitType: UnitType.VOLUME, isBaseUnit: false },
    { code: 'PCS', name: 'Pieces', symbol: 'pcs', unitType: UnitType.COUNT, isBaseUnit: true },
    { code: 'PKT', name: 'Packet', symbol: 'pkt', unitType: UnitType.COUNT, isBaseUnit: false },
    { code: 'CTN', name: 'Carton', symbol: 'ctn', unitType: UnitType.COUNT, isBaseUnit: false },
  ];

  const unitMap: Record<string, string> = {};
  for (const un of unitsData) {
    const u = await prisma.unit.upsert({
      where: { code: un.code },
      update: { name: un.name, symbol: un.symbol, unitType: un.unitType, isBaseUnit: un.isBaseUnit },
      create: un,
    });
    unitMap[un.code] = u.id;
  }

  // 5. STANDARD UNIT CONVERSIONS
  console.log('5. Seeding Standard Unit Conversions...');
  const conversions = [
    { from: 'KG', to: 'G', multiplier: 1000.0 },
    { from: 'G', to: 'KG', multiplier: 0.001 },
    { from: 'LTR', to: 'ML', multiplier: 1000.0 },
    { from: 'ML', to: 'LTR', multiplier: 0.001 },
  ];

  for (const c of conversions) {
    await prisma.unitConversion.upsert({
      where: {
        fromUnitId_toUnitId_productId: {
          fromUnitId: unitMap[c.from],
          toUnitId: unitMap[c.to],
          productId: null as unknown as string,
        },
      },
      update: { multiplier: c.multiplier },
      create: {
        fromUnitId: unitMap[c.from],
        toUnitId: unitMap[c.to],
        multiplier: c.multiplier,
      },
    });
  }

  // 6. PRODUCT CATEGORIES
  console.log('6. Seeding Product Categories...');
  const catValves = await prisma.productCategory.upsert({
    where: { code: 'CAT-VALVES' },
    update: {},
    create: { code: 'CAT-VALVES', name: 'Industrial Valves', description: 'High pressure stainless and forged valves' },
  });

  const catFlanges = await prisma.productCategory.upsert({
    where: { code: 'CAT-FLANGES' },
    update: {},
    create: { code: 'CAT-FLANGES', name: 'Pipe Flanges', description: 'ASME B16.5 weld neck and blind flanges' },
  });

  // 7. PRODUCTS (FINISHED GOODS)
  console.log('7. Seeding Products...');
  const prodValve = await prisma.product.upsert({
    where: { sku: 'PRD-VALVE-001' },
    update: {},
    create: {
      sku: 'PRD-VALVE-001',
      name: '2" Stainless Steel Control Valve ASTM A351',
      description: 'Class 150 flanged precision control valve with PTFE soft seat',
      categoryId: catValves.id,
      hsnCode: '84818030',
      baseUnitId: unitMap['PCS'],
      standardPrice: 2100.00,
      minOrderQty: 5.0,
      safetyStock: 50.0,
      isActive: true,
    },
  });

  const prodFlange = await prisma.product.upsert({
    where: { sku: 'PRD-FLANGE-002' },
    update: {},
    create: {
      sku: 'PRD-FLANGE-002',
      name: 'High-Pressure Weld Neck Flange 4"',
      description: 'ANSI Class 300 RF SS 304 flange',
      categoryId: catFlanges.id,
      hsnCode: '73072100',
      baseUnitId: unitMap['PCS'],
      standardPrice: 450.00,
      minOrderQty: 10.0,
      safetyStock: 100.0,
      isActive: true,
    },
  });

  // Product-specific packaging conversion: 1 Carton = 12 Pieces of Valves
  await prisma.unitConversion.upsert({
    where: {
      fromUnitId_toUnitId_productId: {
        fromUnitId: unitMap['CTN'],
        toUnitId: unitMap['PCS'],
        productId: prodValve.id,
      },
    },
    update: { multiplier: 12.0 },
    create: {
      fromUnitId: unitMap['CTN'],
      toUnitId: unitMap['PCS'],
      multiplier: 12.0,
      productId: prodValve.id,
    },
  });

  // 8. RAW MATERIALS
  console.log('8. Seeding Raw Materials...');
  const rmBar = await prisma.rawMaterial.upsert({
    where: { code: 'RM-SS-316-25' },
    update: {},
    create: {
      code: 'RM-SS-316-25',
      name: 'Stainless Steel 316 Round Bar 25mm',
      description: 'Bright cold-drawn bar for valve spindle machining',
      hsnCode: '72221119',
      unitId: unitMap['KG'],
      standardCost: 425.0000,
      reorderLevel: 500.0000,
      safetyStock: 200.0000,
      storageBin: 'BIN-RM-A01',
      isActive: true,
    },
  });

  const rmSeat = await prisma.rawMaterial.upsert({
    where: { code: 'RM-PTFE-SEAT' },
    update: {},
    create: {
      code: 'RM-PTFE-SEAT',
      name: 'Virgin PTFE Machined Seat Gasket 2"',
      description: 'Chemical resistant high temperature seat ring',
      hsnCode: '39269099',
      unitId: unitMap['PCS'],
      standardCost: 140.0000,
      reorderLevel: 400.0000,
      safetyStock: 150.0000,
      storageBin: 'BIN-RM-B04',
      isActive: true,
    },
  });

  const rmBolts = await prisma.rawMaterial.upsert({
    where: { code: 'RM-FAST-M8' },
    update: {},
    create: {
      code: 'RM-FAST-M8',
      name: 'Hex Bolt SS 304 M8 x 40mm with Nut',
      description: 'High tensile bonnets studs and fasteners',
      hsnCode: '73181500',
      unitId: unitMap['PCS'],
      standardCost: 15.0000,
      reorderLevel: 1000.0000,
      safetyStock: 500.0000,
      storageBin: 'BIN-RM-C12',
      isActive: true,
    },
  });

  // 9. PACKAGING MATERIALS
  console.log('9. Seeding Packaging Materials...');
  const pmBox = await prisma.packagingMaterial.upsert({
    where: { code: 'PM-BOX-HEAVY' },
    update: {},
    create: {
      code: 'PM-BOX-HEAVY',
      name: 'Corrugated Master Box 5-Ply 400x300x300mm',
      description: 'Heavy duty shipping carton for valves export',
      hsnCode: '48191010',
      unitId: unitMap['CTN'],
      standardCost: 85.0000,
      reorderLevel: 200.0000,
      safetyStock: 50.0000,
      storageBin: 'BIN-PKG-01',
      isActive: true,
    },
  });

  // 10. BILL OF MATERIALS (BOM)
  console.log('10. Seeding Bill of Materials (BOM V1.0 for PRD-VALVE-001)...');
  const bomValve = await prisma.billOfMaterial.upsert({
    where: { bomNumber: 'BOM-VALVE-001-V1' },
    update: {},
    create: {
      bomNumber: 'BOM-VALVE-001-V1',
      productId: prodValve.id,
      version: 'V1.0',
      batchSize: 1.0,
      unitId: unitMap['PCS'],
      status: BOMStatus.ACTIVE,
      effectiveDate: new Date('2026-01-01'),
      approvedBy: userMap[SystemRole.OWNER],
      items: {
        create: [
          {
            itemType: ItemType.RAW_MATERIAL,
            rawMaterialId: rmBar.id,
            standardQty: 2.4000, // 2.4 kg per valve
            scrapPercentage: 5.00, // 5% machining turnings scrap
            unitId: unitMap['KG'],
          },
          {
            itemType: ItemType.RAW_MATERIAL,
            rawMaterialId: rmSeat.id,
            standardQty: 1.0000, // 1 seat per valve
            scrapPercentage: 1.00,
            unitId: unitMap['PCS'],
          },
          {
            itemType: ItemType.RAW_MATERIAL,
            rawMaterialId: rmBolts.id,
            standardQty: 4.0000, // 4 bolts per valve
            scrapPercentage: 0.00,
            unitId: unitMap['PCS'],
          },
        ],
      },
    },
  });

  // 11. CUSTOMERS
  console.log('11. Seeding Customers and Addresses...');
  const customerApex = await prisma.customer.upsert({
    where: { code: 'CUST-APEX-001' },
    update: {},
    create: {
      code: 'CUST-APEX-001',
      name: 'Apex Industrial Tools Pvt Ltd',
      gstin: '27AABCT3518Q1ZS',
      pan: 'AABCT3518Q',
      email: 'procurement@apextools.co.in',
      phone: '+91 20 2748 9911',
      creditLimit: 1000000.00, // INR 10 Lakhs
      creditDays: 45,
      status: CustomerStatus.ACTIVE,
      addresses: {
        create: [
          {
            addressType: AddressType.BILLING,
            addressLine1: 'Plot 42, MIDC Industrial Area, Bhosari',
            city: 'Pune',
            state: 'Maharashtra',
            stateCode: '27',
            postalCode: '411026',
            country: 'India',
            isDefault: true,
          },
          {
            addressType: AddressType.SHIPPING,
            addressLine1: 'Warehouse Gate 3, Sector 10, MIDC',
            city: 'Pune',
            state: 'Maharashtra',
            stateCode: '27',
            postalCode: '411026',
            country: 'India',
            isDefault: true,
          },
        ],
      },
    },
  });

  // 12. SUPPLIERS
  console.log('12. Seeding Suppliers...');
  const supplierJindal = await prisma.supplier.upsert({
    where: { code: 'SUP-JINDAL-01' },
    update: {},
    create: {
      code: 'SUP-JINDAL-01',
      name: 'Jindal Special Alloy Steels Ltd',
      gstin: '27AAACJ2241R1ZM',
      pan: 'AAACJ2241R',
      email: 'sales@jindalalloys.com',
      phone: '+91 22 6124 8800',
      address: 'Nariman Point, Mumbai - 400021, Maharashtra',
      paymentTerms: '30 Days Net from GRN',
      status: SupplierStatus.ACTIVE,
    },
  });

  // 13. INVENTORY ITEMS & INITIAL STOCKS
  console.log('13. Initializing Inventory Master Records & Initial Stock Batches...');
  const invProduct = await prisma.inventoryItem.upsert({
    where: { productId: prodValve.id },
    update: {},
    create: {
      itemType: InventoryItemType.PRODUCT,
      productId: prodValve.id,
      storageLocation: 'WAREHOUSE-FG-BAY-1',
      unitId: unitMap['PCS'],
      currentStock: 120.0000,
      reservedStock: 20.0000,
      availableStock: 100.0000,
      averageCost: 1420.0000,
    },
  });

  const invRM = await prisma.inventoryItem.upsert({
    where: { rawMaterialId: rmBar.id },
    update: {},
    create: {
      itemType: InventoryItemType.RAW_MATERIAL,
      rawMaterialId: rmBar.id,
      storageLocation: 'WAREHOUSE-RM-BIN-A01',
      unitId: unitMap['KG'],
      currentStock: 850.0000,
      reservedStock: 240.0000,
      availableStock: 610.0000,
      averageCost: 425.0000,
    },
  });

  // Stock Batch for Raw Material
  const batchRM = await prisma.stockBatch.upsert({
    where: { batchNumber: 'LOT-RM-2026-11-01' },
    update: {},
    create: {
      batchNumber: 'LOT-RM-2026-11-01',
      inventoryItemId: invRM.id,
      mfgDate: new Date('2026-10-15'),
      initialQty: 1000.0000,
      currentQty: 850.0000,
      unitCost: 425.0000,
      status: BatchStatus.ACTIVE,
    },
  });

  // 14. SEED INITIAL STOCK MOVEMENTS (Double-entry audit trail)
  console.log('14. Seeding Initial Double-Entry Stock Movement...');
  await prisma.stockMovement.upsert({
    where: { movementNumber: 'MV-2026-0001' },
    update: {},
    create: {
      movementNumber: 'MV-2026-0001',
      movementType: StockMovementType.GRN_RECEIPT,
      sourceDocumentType: SourceDocumentType.PURCHASE_GRN,
      sourceDocumentId: 'GRN-2026-11-0089',
      inventoryItemId: invRM.id,
      stockBatchId: batchRM.id,
      sourceLocation: 'VENDOR:Jindal Special Alloy Steels',
      destLocation: 'WAREHOUSE-RM-BIN-A01',
      quantity: 1000.0000,
      unitCost: 425.0000,
      totalValue: 425000.00,
      isPosted: true,
      performedBy: userMap[SystemRole.PRODUCTION_SUPERVISOR],
    },
  });

  // 15. APP SETTINGS
  console.log('15. Seeding System Application Settings...');
  const appSettings = [
    { key: 'COMPANY_NAME', value: 'Precision Valve Manufacturing Ltd', description: 'Legal Entity Name', category: 'COMPANY' },
    { key: 'COMPANY_GSTIN', value: '27AAAAA0000A1Z5', description: 'Primary GSTIN Registration', category: 'TAX' },
    { key: 'COMPANY_STATE_CODE', value: '27', description: 'Two digit Indian GST State Code (27 = Maharashtra)', category: 'TAX' },
    { key: 'DEFAULT_CURRENCY', value: 'INR', description: 'System Base Currency', category: 'FINANCE' },
    { key: 'STOCK_VALUATION_METHOD', value: 'WEIGHTED_AVERAGE', description: 'Inventory valuation methodology (WEIGHTED_AVERAGE | FIFO)', category: 'INVENTORY' },
    { key: 'AUDIT_LOCK_PERIOD', value: '2026-10', description: 'Current sealed and locked accounting period (YYYY-MM)', category: 'AUDIT' },
  ];

  for (const s of appSettings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description, category: s.category },
      create: s,
    });
  }

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
