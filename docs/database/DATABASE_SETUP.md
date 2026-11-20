# Database Setup & Relational Architecture Guide
## Order-to-Audit Manufacturing ERP

This guide documents the database architecture, schema setup, initial migration, seed execution, and integrity verification for the **Order-to-Audit Manufacturing ERP** system.

---

## 1. Prerequisites & Environment Setup

- **PostgreSQL**: 14.x or higher (PostgreSQL 16 recommended)
- **Node.js**: v20+ / v22+ / v24+
- **Prisma ORM**: 5.x / 6.x

### Environment Variables
Configure your `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ordertoaudit_erp?schema=public"

# Node Environment
NODE_ENV="development"
PORT=5000
```

---

## 2. Database Migration & Deployment

### Apply the Initial Schema Migration
The complete, production-ready schema migration containing all 36 tables, 24 enum types, composite indices, foreign keys, and PostgreSQL immutability triggers is located at:
`prisma/migrations/20261120000000_init/migration.sql`

To apply this migration to your PostgreSQL instance:

```bash
# Using Prisma CLI
npx prisma migrate deploy

# Or directly using psql CLI
psql -U postgres -d ordertoaudit_erp -f prisma/migrations/20261120000000_init/migration.sql
```

---

## 3. Seed Master Data

The seed script creates initial system roles (Owner, Admin, Salesman, Production Supervisor, Accountant, Auditor), standard units of measure, unit conversions, raw materials, BOM structures, customer profiles, and initial stock batches:

```bash
# Run the TypeScript seed script
npm run prisma:seed
# Or via Node native runner:
node --experimental-strip-types prisma/seed.ts
```

### Seeded Credentials (Demo / Testing)
All default seed users are configured with initial password `DemoPass@2026`:
- **Owner**: `owner@enterprise.com`
- **Admin**: `admin@enterprise.com`
- **Salesman**: `sales@enterprise.com`
- **Production Supervisor**: `production@enterprise.com`
- **Accountant**: `accounts@enterprise.com`
- **Auditor**: `auditor@enterprise.com`

---

## 4. Database Integrity & Constraint Verification

An automated 114-point relational integrity test suite is provided to verify that schema invariants, decimal precisions, double-entry stock requirements, and immutability triggers are enforced:

```bash
npm run test:db-integrity
# Or directly:
node --experimental-strip-types tests/database-integrity.ts
```

### Verified Rules:
1. **Model & Table Coverage**: All 36 required entities.
2. **Enum Coverage**: 24 distinct business status enums and all 6 core system roles.
3. **Decimal Precision**:
   - Currency & Financial Values: `DECIMAL(14,2)`
   - Raw Material Costs & Rates: `DECIMAL(14,4)`
   - Stock & Production Quantities: `DECIMAL(14,4)`
   - Conversion Multipliers: `DECIMAL(14,6)`
   - Tax Rates & Scrap Percentages: `DECIMAL(5,2)`
4. **Referential Integrity**: Cascading deletes for line items and addresses; strict `RESTRICT` on master units, products, and raw materials.
5. **Double-Entry Stock Invariant**:
   - `chk_stock_movement_source_doc` enforces valid source document links.
   - `chk_stock_movement_qty` enforces positive quantities.
   - `trg_stock_movements_immutability` trigger blocks deletes and updates of posted movements.
6. **Statutory Tax Invariant**:
   - `trg_invoices_deletion_guard` trigger blocks deletion of posted GST invoices.
7. **Mathematical Unit Conversion**: Validates conversions between `kg <-> g`, `L <-> ml`, and `carton <-> pcs`.
8. **Unique Business Identifiers**: Unique constraints on SKUs, POs, Run numbers, Batch numbers, Invoice numbers, and Movement vouchers.

---

## 5. ER Diagram & Schema File References

- **Prisma Schema**: [`prisma/schema.prisma`](file:///d:/INTERNSHIP/nit-intern/prisma/schema.prisma)
- **Initial SQL Migration**: [`prisma/migrations/20261120000000_init/migration.sql`](file:///d:/INTERNSHIP/nit-intern/prisma/migrations/20261120000000_init/migration.sql)
- **Seed Script**: [`prisma/seed.ts`](file:///d:/INTERNSHIP/nit-intern/prisma/seed.ts)
- **Integrity Test Suite**: [`tests/database-integrity.ts`](file:///d:/INTERNSHIP/nit-intern/tests/database-integrity.ts)
