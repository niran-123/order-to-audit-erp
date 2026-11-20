-- ============================================================================
-- ORDER-TO-AUDIT MANUFACTURING ERP - INITIAL SCHEMA MIGRATION
-- Database: PostgreSQL 14+
-- Version: 20261120000000_init
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE "SystemRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'SALESMAN',
    'PRODUCTION_SUPERVISOR',
    'ACCOUNTANT',
    'AUDITOR'
);

CREATE TYPE "CustomerStatus" AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'INACTIVE'
);

CREATE TYPE "AddressType" AS ENUM (
    'BILLING',
    'SHIPPING'
);

CREATE TYPE "SupplierStatus" AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'INACTIVE'
);

CREATE TYPE "UnitType" AS ENUM (
    'WEIGHT',
    'VOLUME',
    'COUNT'
);

CREATE TYPE "BOMStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'OBSOLETE'
);

CREATE TYPE "ItemType" AS ENUM (
    'RAW_MATERIAL',
    'PACKAGING_MATERIAL',
    'PRODUCT'
);

CREATE TYPE "ProductionStatus" AS ENUM (
    'PLANNED',
    'RELEASED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE "WastageReason" AS ENUM (
    'TOOL_WEAR',
    'PROCESS_DEFECT',
    'OPERATOR_ERROR',
    'CONTAMINATION',
    'EVAPORATION',
    'MACHINE_BREAKDOWN',
    'EXPIRED'
);

CREATE TYPE "OverheadType" AS ENUM (
    'DIRECT_LABOR',
    'POWER_ELECTRICITY',
    'MACHINE_MAINTENANCE',
    'FACTORY_OVERHEAD',
    'TOOLING_DEPRECIATION'
);

CREATE TYPE "PurchaseStatus" AS ENUM (
    'DRAFT',
    'APPROVED',
    'ORDERED',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CANCELLED'
);

CREATE TYPE "InventoryItemType" AS ENUM (
    'PRODUCT',
    'RAW_MATERIAL',
    'PACKAGING_MATERIAL'
);

CREATE TYPE "BatchStatus" AS ENUM (
    'ACTIVE',
    'QUARANTINE',
    'EXPIRED',
    'CONSUMED'
);

CREATE TYPE "StockMovementType" AS ENUM (
    'GRN_RECEIPT',
    'PRODUCTION_ISSUE',
    'PRODUCTION_RETURN',
    'FG_RECEIPT',
    'DISPATCH_OUT',
    'STOCK_ADJUSTMENT',
    'SCRAP_DISPOSAL'
);

CREATE TYPE "SourceDocumentType" AS ENUM (
    'PURCHASE_GRN',
    'PRODUCTION_RUN',
    'SALES_DISPATCH',
    'AUDIT_ADJUSTMENT'
);

CREATE TYPE "SalesOrderStatus" AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'ALLOCATED',
    'IN_PRODUCTION',
    'PARTIALLY_DISPATCHED',
    'DISPATCHED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE "InvoiceType" AS ENUM (
    'TAX_INVOICE',
    'BILL_OF_SUPPLY',
    'CREDIT_NOTE'
);

CREATE TYPE "InvoiceStatus" AS ENUM (
    'DRAFT',
    'POSTED',
    'PARTIALLY_PAID',
    'PAID',
    'CANCELLED'
);

CREATE TYPE "DispatchStatus" AS ENUM (
    'PENDING',
    'DISPATCHED',
    'DELIVERED'
);

CREATE TYPE "PaymentType" AS ENUM (
    'INBOUND_CUSTOMER',
    'OUTBOUND_SUPPLIER'
);

CREATE TYPE "PaymentMode" AS ENUM (
    'CASH',
    'NEFT',
    'RTGS',
    'CHEQUE',
    'UPI'
);

CREATE TYPE "PaymentStatus" AS ENUM (
    'RECEIVED',
    'CLEARED',
    'BOUNCED'
);

CREATE TYPE "CostType" AS ENUM (
    'DIRECT_MATERIAL',
    'DIRECT_LABOR',
    'MANUFACTURING_OVERHEAD',
    'PACKAGING_COST',
    'FREIGHT_LOGISTICS'
);

CREATE TYPE "CostReferenceType" AS ENUM (
    'PRODUCTION_RUN',
    'PURCHASE',
    'DISPATCH'
);

CREATE TYPE "AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'POST',
    'CANCEL',
    'DELETE_ATTEMPT',
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'ACCESS_DENIED'
);

-- ============================================================================
-- 2. AUTHENTICATION & ACCESS CONTROL
-- ============================================================================

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" "SystemRole" NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id")
);

CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refresh_tokens_token_key" UNIQUE ("token")
);

-- ============================================================================
-- 3. MASTER DATA
-- ============================================================================

CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "gstin" VARCHAR(20),
    "pan" VARCHAR(20),
    "email" VARCHAR(255),
    "phone" VARCHAR(25) NOT NULL,
    "credit_limit" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "credit_days" INTEGER NOT NULL DEFAULT 30,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "address_type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "state_code" VARCHAR(5) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "gstin" VARCHAR(20),
    "pan" VARCHAR(20),
    "email" VARCHAR(255),
    "phone" VARCHAR(25) NOT NULL,
    "address" TEXT,
    "payment_terms" VARCHAR(100),
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "unit_type" "UnitType" NOT NULL,
    "is_base_unit" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "unit_conversions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_unit_id" UUID NOT NULL,
    "to_unit_id" UUID NOT NULL,
    "multiplier" DECIMAL(14,6) NOT NULL,
    "product_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "unit_conversions_from_to_product_key" UNIQUE ("from_unit_id", "to_unit_id", "product_id")
);

CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category_id" UUID NOT NULL,
    "hsn_code" VARCHAR(20) NOT NULL,
    "base_unit_id" UUID NOT NULL,
    "standard_price" DECIMAL(14,2) NOT NULL,
    "min_order_qty" DECIMAL(14,4) NOT NULL DEFAULT 1.0000,
    "safety_stock" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "raw_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "hsn_code" VARCHAR(20),
    "unit_id" UUID NOT NULL,
    "standard_cost" DECIMAL(14,4) NOT NULL,
    "reorder_level" DECIMAL(14,4) NOT NULL,
    "safety_stock" DECIMAL(14,4) NOT NULL,
    "storage_bin" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "packaging_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "hsn_code" VARCHAR(20),
    "unit_id" UUID NOT NULL,
    "standard_cost" DECIMAL(14,4) NOT NULL,
    "reorder_level" DECIMAL(14,4) NOT NULL,
    "safety_stock" DECIMAL(14,4) NOT NULL,
    "storage_bin" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packaging_materials_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 4. PRODUCTION & MANUFACTURING
-- ============================================================================

CREATE TABLE "bill_of_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bom_number" VARCHAR(50) NOT NULL,
    "product_id" UUID NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "batch_size" DECIMAL(14,4) NOT NULL DEFAULT 1.0000,
    "unit_id" UUID NOT NULL,
    "status" "BOMStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bill_of_materials_product_id_version_key" UNIQUE ("product_id", "version")
);

CREATE TABLE "bom_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bom_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "raw_material_id" UUID,
    "packaging_material_id" UUID,
    "standard_qty" DECIMAL(14,4) NOT NULL,
    "scrap_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "unit_id" UUID NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_number" VARCHAR(50) NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "bom_id" UUID NOT NULL,
    "sales_order_id" UUID,
    "target_qty" DECIMAL(14,4) NOT NULL,
    "actual_produced_qty" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "rejected_qty" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "status" "ProductionStatus" NOT NULL DEFAULT 'PLANNED',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "supervisor_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_consumptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_run_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "raw_material_id" UUID,
    "packaging_material_id" UUID,
    "standard_qty" DECIMAL(14,4) NOT NULL,
    "actual_qty" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(14,4) NOT NULL,
    "total_cost" DECIMAL(14,2) NOT NULL,
    "unit_id" UUID NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_consumptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_outputs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_run_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_id" UUID NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "stock_batch_id" UUID,
    "storage_bin" VARCHAR(50),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_outputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wastage_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_run_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "raw_material_id" UUID,
    "packaging_material_id" UUID,
    "product_id" UUID,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_id" UUID NOT NULL,
    "reason" "WastageReason" NOT NULL,
    "recorded_by" UUID NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wastage_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_overheads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "production_run_id" UUID NOT NULL,
    "overhead_type" "OverheadType" NOT NULL,
    "cost" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(255),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_overheads_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 5. PURCHASING & PROCUREMENT
-- ============================================================================

CREATE TABLE "purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "po_number" VARCHAR(50) NOT NULL,
    "supplier_id" UUID NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery_date" TIMESTAMP(3),
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "approved_by" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "raw_material_id" UUID,
    "packaging_material_id" UUID,
    "ordered_qty" DECIMAL(14,4) NOT NULL,
    "received_qty" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "unit_price" DECIMAL(14,4) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "line_total" DECIMAL(14,2) NOT NULL,
    "unit_id" UUID NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 6. INVENTORY & STOCK LEDGER
-- ============================================================================

CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_type" "InventoryItemType" NOT NULL,
    "product_id" UUID,
    "raw_material_id" UUID,
    "packaging_material_id" UUID,
    "storage_location" VARCHAR(100),
    "unit_id" UUID NOT NULL,
    "current_stock" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "reserved_stock" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "available_stock" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "average_cost" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_items_product_id_key" UNIQUE ("product_id"),
    CONSTRAINT "inventory_items_raw_material_id_key" UNIQUE ("raw_material_id"),
    CONSTRAINT "inventory_items_packaging_material_id_key" UNIQUE ("packaging_material_id")
);

CREATE TABLE "stock_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_number" VARCHAR(50) NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "mfg_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "initial_qty" DECIMAL(14,4) NOT NULL,
    "current_qty" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(14,4) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "movement_number" VARCHAR(50) NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "source_document_type" "SourceDocumentType" NOT NULL,
    "source_document_id" VARCHAR(100) NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "stock_batch_id" UUID,
    "source_location" VARCHAR(100) NOT NULL,
    "dest_location" VARCHAR(100) NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(14,4) NOT NULL,
    "total_value" DECIMAL(14,2) NOT NULL,
    "is_posted" BOOLEAN NOT NULL DEFAULT true,
    "performed_by" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_stock_movement_source_doc" CHECK (source_document_id IS NOT NULL AND length(trim(source_document_id)) > 0),
    CONSTRAINT "chk_stock_movement_qty" CHECK (quantity > 0)
);

CREATE TABLE "stock_balances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_item_id" UUID NOT NULL,
    "warehouse_location" VARCHAR(100) NOT NULL,
    "quantity_on_hand" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "valuation" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "stock_balances_item_location_key" UNIQUE ("inventory_item_id", "warehouse_location")
);

-- ============================================================================
-- 7. SALES, INVOICING & DISPATCH
-- ============================================================================

CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "so_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery_date" TIMESTAMP(3),
    "payment_terms" VARCHAR(100),
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "ordered_qty" DECIMAL(14,4) NOT NULL,
    "allocated_qty" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "dispatched_qty" DECIMAL(14,4) NOT NULL DEFAULT 0.0000,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "line_total" DECIMAL(14,2) NOT NULL,
    "unit_id" UUID NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_number" VARCHAR(50) NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "invoice_type" "InvoiceType" NOT NULL DEFAULT 'TAX_INVOICE',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "taxable_amount" DECIMAL(14,2) NOT NULL,
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "total_tax" DECIMAL(14,2) NOT NULL,
    "grand_total" DECIMAL(14,2) NOT NULL,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "irn" VARCHAR(100),
    "qr_code" TEXT,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "posted_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "hsn_code" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "taxable_value" DECIMAL(14,2) NOT NULL,
    "cgst_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "sgst_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "igst_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "unit_id" UUID NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispatch_number" VARCHAR(50) NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "delivery_challan_no" VARCHAR(50) NOT NULL,
    "dispatch_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carrier_name" VARCHAR(100),
    "tracking_number" VARCHAR(100),
    "vehicle_number" VARCHAR(50),
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatch_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispatch_id" UUID NOT NULL,
    "sales_order_item_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "dispatched_qty" DECIMAL(14,4) NOT NULL,
    "stock_batch_id" UUID,
    "unit_id" UUID NOT NULL,

    CONSTRAINT "dispatch_items_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 8. FINANCE & COSTING
-- ============================================================================

CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID,
    "supplier_id" UUID,
    "payment_type" "PaymentType" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "reference_number" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "status" "PaymentStatus" NOT NULL DEFAULT 'RECEIVED',
    "unallocated_amount" DECIMAL(14,2) NOT NULL,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID,
    "purchase_id" UUID,
    "allocated_amount" DECIMAL(14,2) NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID NOT NULL,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cost_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cost_type" "CostType" NOT NULL,
    "reference_type" "CostReferenceType" NOT NULL,
    "reference_id" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(255),
    "recorded_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_records_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 9. AUDIT LOGS & APP SETTINGS
-- ============================================================================

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "entity_name" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "action_type" "AuditAction" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(255),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" VARCHAR(255),
    "category" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 10. UNIQUE CONSTRAINTS
-- ============================================================================

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");
CREATE UNIQUE INDEX "product_categories_code_key" ON "product_categories"("code");
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE UNIQUE INDEX "raw_materials_code_key" ON "raw_materials"("code");
CREATE UNIQUE INDEX "packaging_materials_code_key" ON "packaging_materials"("code");
CREATE UNIQUE INDEX "bill_of_materials_bom_number_key" ON "bill_of_materials"("bom_number");
CREATE UNIQUE INDEX "production_runs_run_number_key" ON "production_runs"("run_number");
CREATE UNIQUE INDEX "production_runs_batch_number_key" ON "production_runs"("batch_number");
CREATE UNIQUE INDEX "purchases_po_number_key" ON "purchases"("po_number");
CREATE UNIQUE INDEX "stock_batches_batch_number_key" ON "stock_batches"("batch_number");
CREATE UNIQUE INDEX "stock_movements_movement_number_key" ON "stock_movements"("movement_number");
CREATE UNIQUE INDEX "sales_orders_so_number_key" ON "sales_orders"("so_number");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE UNIQUE INDEX "invoices_irn_key" ON "invoices"("irn");
CREATE UNIQUE INDEX "dispatches_dispatch_number_key" ON "dispatches"("dispatch_number");
CREATE UNIQUE INDEX "dispatches_delivery_challan_no_key" ON "dispatches"("delivery_challan_no");
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- ============================================================================
-- 11. INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_is_active" ON "users"("is_active");
CREATE INDEX "idx_permissions_module" ON "permissions"("module");
CREATE INDEX "idx_user_roles_user_id" ON "user_roles"("user_id");
CREATE INDEX "idx_user_roles_role_id" ON "user_roles"("role_id");
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");
CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token");

CREATE INDEX "idx_customers_code" ON "customers"("code");
CREATE INDEX "idx_customers_gstin" ON "customers"("gstin");
CREATE INDEX "idx_customers_status" ON "customers"("status");
CREATE INDEX "idx_customer_addresses_customer_id" ON "customer_addresses"("customer_id");

CREATE INDEX "idx_suppliers_code" ON "suppliers"("code");
CREATE INDEX "idx_suppliers_gstin" ON "suppliers"("gstin");
CREATE INDEX "idx_suppliers_status" ON "suppliers"("status");

CREATE INDEX "idx_product_categories_parent_id" ON "product_categories"("parent_id");
CREATE INDEX "idx_unit_conversions_from_unit_id" ON "unit_conversions"("from_unit_id");
CREATE INDEX "idx_unit_conversions_to_unit_id" ON "unit_conversions"("to_unit_id");

CREATE INDEX "idx_products_sku" ON "products"("sku");
CREATE INDEX "idx_products_category_id" ON "products"("category_id");
CREATE INDEX "idx_products_hsn_code" ON "products"("hsn_code");
CREATE INDEX "idx_products_is_active" ON "products"("is_active");

CREATE INDEX "idx_raw_materials_code" ON "raw_materials"("code");
CREATE INDEX "idx_raw_materials_is_active" ON "raw_materials"("is_active");
CREATE INDEX "idx_packaging_materials_code" ON "packaging_materials"("code");
CREATE INDEX "idx_packaging_materials_is_active" ON "packaging_materials"("is_active");

CREATE INDEX "idx_boms_bom_number" ON "bill_of_materials"("bom_number");
CREATE INDEX "idx_boms_product_id" ON "bill_of_materials"("product_id");
CREATE INDEX "idx_boms_status" ON "bill_of_materials"("status");
CREATE INDEX "idx_bom_items_bom_id" ON "bom_items"("bom_id");
CREATE INDEX "idx_bom_items_raw_material_id" ON "bom_items"("raw_material_id");
CREATE INDEX "idx_bom_items_packaging_material_id" ON "bom_items"("packaging_material_id");

CREATE INDEX "idx_production_runs_run_number" ON "production_runs"("run_number");
CREATE INDEX "idx_production_runs_batch_number" ON "production_runs"("batch_number");
CREATE INDEX "idx_production_runs_bom_id" ON "production_runs"("bom_id");
CREATE INDEX "idx_production_runs_sales_order_id" ON "production_runs"("sales_order_id");
CREATE INDEX "idx_production_runs_status" ON "production_runs"("status");

CREATE INDEX "idx_production_consumptions_run_id" ON "production_consumptions"("production_run_id");
CREATE INDEX "idx_production_outputs_run_id" ON "production_outputs"("production_run_id");
CREATE INDEX "idx_production_outputs_product_id" ON "production_outputs"("product_id");
CREATE INDEX "idx_production_outputs_batch_number" ON "production_outputs"("batch_number");
CREATE INDEX "idx_wastage_records_run_id" ON "wastage_records"("production_run_id");
CREATE INDEX "idx_wastage_records_reason" ON "wastage_records"("reason");
CREATE INDEX "idx_production_overheads_run_id" ON "production_overheads"("production_run_id");

CREATE INDEX "idx_purchases_po_number" ON "purchases"("po_number");
CREATE INDEX "idx_purchases_supplier_id" ON "purchases"("supplier_id");
CREATE INDEX "idx_purchases_status" ON "purchases"("status");
CREATE INDEX "idx_purchase_items_purchase_id" ON "purchase_items"("purchase_id");

CREATE INDEX "idx_inventory_items_item_type" ON "inventory_items"("item_type");
CREATE INDEX "idx_inventory_items_storage_location" ON "inventory_items"("storage_location");
CREATE INDEX "idx_stock_batches_batch_number" ON "stock_batches"("batch_number");
CREATE INDEX "idx_stock_batches_item_id" ON "stock_batches"("inventory_item_id");
CREATE INDEX "idx_stock_batches_status" ON "stock_batches"("status");

CREATE INDEX "idx_stock_movements_number" ON "stock_movements"("movement_number");
CREATE INDEX "idx_stock_movements_type" ON "stock_movements"("movement_type");
CREATE INDEX "idx_stock_movements_source_doc" ON "stock_movements"("source_document_type", "source_document_id");
CREATE INDEX "idx_stock_movements_item_id" ON "stock_movements"("inventory_item_id");
CREATE INDEX "idx_stock_movements_batch_id" ON "stock_movements"("stock_batch_id");
CREATE INDEX "idx_stock_movements_timestamp" ON "stock_movements"("timestamp");
CREATE INDEX "idx_stock_balances_location" ON "stock_balances"("warehouse_location");

CREATE INDEX "idx_sales_orders_so_number" ON "sales_orders"("so_number");
CREATE INDEX "idx_sales_orders_customer_id" ON "sales_orders"("customer_id");
CREATE INDEX "idx_sales_orders_status" ON "sales_orders"("status");
CREATE INDEX "idx_sales_order_items_so_id" ON "sales_order_items"("sales_order_id");
CREATE INDEX "idx_sales_order_items_product_id" ON "sales_order_items"("product_id");

CREATE INDEX "idx_invoices_number" ON "invoices"("invoice_number");
CREATE INDEX "idx_invoices_so_id" ON "invoices"("sales_order_id");
CREATE INDEX "idx_invoices_customer_id" ON "invoices"("customer_id");
CREATE INDEX "idx_invoices_status" ON "invoices"("status");
CREATE INDEX "idx_invoices_is_posted" ON "invoices"("is_posted");
CREATE INDEX "idx_invoices_invoice_date" ON "invoices"("invoice_date");
CREATE INDEX "idx_invoice_items_invoice_id" ON "invoice_items"("invoice_id");

CREATE INDEX "idx_dispatches_number" ON "dispatches"("dispatch_number");
CREATE INDEX "idx_dispatches_so_id" ON "dispatches"("sales_order_id");
CREATE INDEX "idx_dispatches_challan" ON "dispatches"("delivery_challan_no");
CREATE INDEX "idx_dispatches_status" ON "dispatches"("status");
CREATE INDEX "idx_dispatch_items_dispatch_id" ON "dispatch_items"("dispatch_id");

CREATE INDEX "idx_payments_number" ON "payments"("payment_number");
CREATE INDEX "idx_payments_customer_id" ON "payments"("customer_id");
CREATE INDEX "idx_payments_supplier_id" ON "payments"("supplier_id");
CREATE INDEX "idx_payments_type" ON "payments"("payment_type");
CREATE INDEX "idx_payments_status" ON "payments"("status");
CREATE INDEX "idx_payment_allocations_payment_id" ON "payment_allocations"("payment_id");
CREATE INDEX "idx_payment_allocations_invoice_id" ON "payment_allocations"("invoice_id");
CREATE INDEX "idx_payment_allocations_purchase_id" ON "payment_allocations"("purchase_id");

CREATE INDEX "idx_cost_records_type" ON "cost_records"("cost_type");
CREATE INDEX "idx_cost_records_ref" ON "cost_records"("reference_type", "reference_id");
CREATE INDEX "idx_cost_records_date" ON "cost_records"("recorded_date");

CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_name", "entity_id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action_type");
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs"("timestamp");
CREATE INDEX "idx_app_settings_key" ON "app_settings"("key");
CREATE INDEX "idx_app_settings_category" ON "app_settings"("category");

-- ============================================================================
-- 12. FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_from_unit_id_fkey" FOREIGN KEY ("from_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_to_unit_id_fkey" FOREIGN KEY ("to_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "packaging_materials" ADD CONSTRAINT "packaging_materials_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "bill_of_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_packaging_material_id_fkey" FOREIGN KEY ("packaging_material_id") REFERENCES "packaging_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "bill_of_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_production_run_id_fkey" FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_packaging_material_id_fkey" FOREIGN KEY ("packaging_material_id") REFERENCES "packaging_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_production_run_id_fkey" FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wastage_records" ADD CONSTRAINT "wastage_records_production_run_id_fkey" FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wastage_records" ADD CONSTRAINT "wastage_records_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wastage_records" ADD CONSTRAINT "wastage_records_packaging_material_id_fkey" FOREIGN KEY ("packaging_material_id") REFERENCES "packaging_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wastage_records" ADD CONSTRAINT "wastage_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wastage_records" ADD CONSTRAINT "wastage_records_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wastage_records" ADD CONSTRAINT "wastage_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "production_overheads" ADD CONSTRAINT "production_overheads_production_run_id_fkey" FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_packaging_material_id_fkey" FOREIGN KEY ("packaging_material_id") REFERENCES "packaging_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_packaging_material_id_fkey" FOREIGN KEY ("packaging_material_id") REFERENCES "packaging_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_batch_id_fkey" FOREIGN KEY ("stock_batch_id") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_sales_order_item_id_fkey" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_stock_batch_id_fkey" FOREIGN KEY ("stock_batch_id") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dispatch_items" ADD CONSTRAINT "dispatch_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 13. POSTGRESQL IMMUTABILITY & AUDIT TRIGGERS
-- ============================================================================

-- Function: Prevent deletion or alteration of posted stock movements
CREATE OR REPLACE FUNCTION fn_prevent_posted_stock_movement_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = true THEN
        RAISE EXCEPTION 'POSTGRES INTEGRITY ERROR: Posted stock movements are immutable. Movement ID: %. Deletion or modification is strictly prohibited. Issue a compensating stock movement instead.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movements_immutability
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_posted_stock_movement_mutation();

-- Function: Prevent deletion of posted statutory GST invoices
CREATE OR REPLACE FUNCTION fn_prevent_posted_invoice_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = true OR OLD.status IN ('POSTED', 'PARTIALLY_PAID', 'PAID') THEN
        RAISE EXCEPTION 'POSTGRES INTEGRITY ERROR: Posted statutory GST invoices cannot be deleted. Invoice Number: %. Issue a statutory Credit Note instead.', OLD.invoice_number;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_deletion_guard
BEFORE DELETE ON "invoices"
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_posted_invoice_deletion();
