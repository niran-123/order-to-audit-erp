# Order-to-Audit Enterprise Manufacturing ERP

[![Production Ready](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()
[![Integration Tests](https://img.shields.io/badge/tests-574%2F574%20passed%20(100%25)-success.svg)]()
[![TypeScript](https://img.shields.io/badge/typescript-v5.3.3-blue.svg)]()
[![React](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)]()
[![Node.js](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green.svg)]()
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016%20%2B%20Prisma-336791.svg)]()
[![Docker](https://img.shields.io/badge/containerized-Docker%20%2B%20Compose-2496ed.svg)]()
[![Accounting Standard](https://img.shields.io/badge/compliance-Ind%20AS%202%20%2F%20GST-orange.svg)]()

> An enterprise-grade, full-stack Manufacturing ERP system engineered to govern the entire operational lifecycle from salesman mobile order capture and automated Bill of Materials (BOM) production runs to double-entry perpetual inventory ledgers, statutory Indian GST invoicing, Ind AS 2 overhead cost absorption, and tamper-evident audit cutoffs.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Technology Stack](#4-technology-stack)
5. [Architecture](#5-architecture)
6. [Folder Structure](#6-folder-structure)
7. [Database Schema](#7-database-schema)
8. [Entity-Relationship Diagram](#8-entity-relationship-diagram)
9. [Installation Instructions](#9-installation-instructions)
10. [Environment Variables](#10-environment-variables)
11. [API Documentation](#11-api-documentation)
12. [Module Descriptions](#12-module-descriptions)
13. [User Roles & Permission Matrix](#13-user-roles--permission-matrix)
14. [Benchmark Scenario (TEST 1 to TEST 12)](#14-benchmark-scenario-test-1-to-test-12)
15. [Benchmark Results & Mathematical Verification](#15-benchmark-results--mathematical-verification)
16. [Costing Methodology (Ind AS 2)](#16-costing-methodology-ind-as-2)
17. [Inventory Valuation Methodology (WAC)](#17-inventory-valuation-methodology-wac)
18. [Known Limitations](#18-known-limitations)
19. [Future Enhancements](#19-future-enhancements)
20. [Test Login Credentials](#20-test-login-credentials)

---

## 1. Project Overview

The **Order-to-Audit ERP** is designed for fast-moving consumer goods (FMCG) and food manufacturing enterprises. Using the benchmark manufacturing process for **Traditional Crunchy Murukku 200g**, the system enforces strict operational and financial segregation across six corporate roles: Executive Owner, System Admin, Field Salesman, Production Supervisor, Financial Accountant, and Statutory Auditor.

The platform provides:
- **Responsive Mobile Order Capture** for field sales personnel with real-time customer price tier resolution.
- **Automated Bill of Materials (BOM)** engine that computes theoretical ingredient requirements, captures actual process issues, records packaging machine line scrap, and calculates batch yields.
- **Perpetual 4-Category Inventory Segregation** (`RAW_MATERIAL`, `PACKAGING_MATERIAL`, `WORK_IN_PROGRESS`, `FINISHED_GOODS`) with strict negative stock prevention and double-entry stock ledgers.
- **Statutory GST Billing Engine** resolving intra-state supplies (CGST 2.5% + SGST 2.5%) and inter-state supplies (IGST 5.0%) with HSN codes and buyer state validation.
- **Physical Dispatch Decoupling**: Finished goods inventory decreases **only** upon generation of confirmed Delivery Challans, never on order submission or invoicing.
- **Financial Accounts Receivable & Cost Absorption**: Real-time invoice allocation, over-allocation prevention, debtor ageing buckets, and Ind AS 2 absorption costing per good packet.
- **Executive BI & Statutory Audit**: 17 dynamic management reports with universal CSV streaming and an immutable, tamper-evident security audit trail.

---

## 2. Problem Statement

Small-to-medium manufacturing and processing enterprises routinely suffer from structural operational breakdowns:
1. **Disconnected Data Silos**: Sales orders recorded via phone or messaging apps fail to verify on-hand inventory, leading to unfulfilled orders, stockouts, and strained distributor relationships.
2. **Untracked Material Shrinkage & Scrap**: Without integrated BOM execution, the variance between planned consumption and actual usage (e.g. oil absorption fluctuations, pouch bursting) remains invisible.
3. **Premature Stock Deductions**: Conventional accounting software decrements inventory upon invoice creation rather than physical factory dispatch, distorting physical stock audits.
4. **Distorted Unit Production Costing**: Failure to absorb process scrap, direct labor, and utility power into good commercial units results in understated cost of goods sold (COGS) and false profit margins.
5. **Statutory Non-Compliance & Fraud**: Missing source document linkages, editable posted tax invoices, and absence of role-segregated audit trails lead to GST penalties and financial audit qualifications.

---

## 3. Objectives

- **Operational Integrity**: Prevent negative stock and enforce source document traceability (`PURCHASE_GRN`, `PRODUCTION_RUN`, `DELIVERY_CHALLAN`) for 100% of inventory movements.
- **Role-Based Access Control**: Implement strict privilege boundaries ensuring salesmen cannot inspect competitors' accounts, supervisors cannot generate tax invoices, and accountants cannot modify posted transactions.
- **Accurate Financial Costing**: Implement Moving Weighted-Average Costing (WAC) for raw materials and Ind AS 2 absorption costing to compute true cost per sound finished packet.
- **Statutory Alignment**: Generate GST-compliant invoices with automated Place of Supply tax determination and GSTR-1 outward supplies summaries.
- **Enterprise Verification**: Validate 100% of system invariants against a standardized 12-stage benchmark integration scenario.

---

## 4. Technology Stack

### Frontend Architecture
- **Framework**: React 18.2 with TypeScript
- **Tooling & Bundler**: Vite 5.4 (Hot Module Replacement, tree-shaking, production chunk splitting)
- **Styling**: Tailwind CSS 3.4 with responsive viewport optimization
- **Routing**: React Router v6 with declarative Protected Routes and RBAC Redirection
- **Icons & Data Display**: Lucide React, HTML5 responsive canvas charts
- **HTTP Client**: Axios with request/response interceptors for JWT bearer tokens and correlation IDs

### Backend Architecture
- **Runtime & Language**: Node.js 20 LTS with TypeScript 5.3
- **Web Framework**: Express.js with modular decoupled routing
- **ORM & Database Layer**: Prisma ORM 5.9 with PostgreSQL 16
- **Validation**: Zod schema validators for incoming request payloads
- **Security & Cryptography**: Helmet, CORS with whitelist validation, bcryptjs password hashing, jsonwebtoken (JWT)
- **Logging & Diagnostics**: Morgan HTTP logging, Winston structured JSON logger, correlation ID tracing

### DevOps & Infrastructure
- **Containerization**: Docker multi-stage builds (Node Alpine builder $\rightarrow$ Nginx Alpine runner)
- **Orchestration**: Docker Compose v2 with health checks and restart policies
- **Database Engine**: PostgreSQL 16 Alpine with persistent named volumes and memory tuning
- **Reverse Proxy**: Nginx 1.25 Alpine with SPA routing fallback, gzip compression, and TLS/HTTPS headers

---

## 5. Architecture

The Order-to-Audit system adopts a Clean Monolithic Architecture organized around domain-driven bounded contexts:

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client Layer (React 18 + Vite)"]
        UI_Owner["Owner Executive Dashboard"]
        UI_Admin["Admin Operations Console"]
        UI_Sales["Salesman Mobile App"]
        UI_Prod["Production Supervisor Portal"]
        UI_Fin["Accountant AR / Costing Hub"]
        UI_Audit["Auditor Inspection & BI Hub"]
    end

    subgraph GatewayLayer["Nginx Edge / Reverse Proxy (Port 80 / 443)"]
        Nginx["Nginx Reverse Proxy & Static SPA Host<br/>• Gzip Compression<br/>• SSL / TLS Termination<br/>• Rate Limiting & Security Headers"]
    end

    subgraph APILayer["Backend API Pipeline (Express + TypeScript :5000)"]
        AuthMiddleware["JWT Authentication & RBAC Guard"]
        ValidationMiddleware["Zod Payload Validation"]
        CorrelationMiddleware["Correlation ID & Audit Logger"]
        
        subgraph DomainModules["Domain-Driven Modules"]
            Mod_Auth["Auth & Security Module"]
            Mod_Master["Master Data Module"]
            Mod_Inv["Inventory & Purchasing Module"]
            Mod_Prod["Production & BOM Module"]
            Mod_Sales["Sales & Invoicing Module"]
            Mod_Fin["Finance & Costing Module"]
            Mod_Rep["Reporting & BI Engine"]
            Mod_Audit["Immutable Audit Log Service"]
        end
    end

    subgraph DataLayer["Persistence & Database Layer"]
        Prisma["Prisma ORM 5.9 (Connection Pool, Type-Safe Queries)"]
        Postgres[("PostgreSQL 16 Alpine<br/>• 36 Relational Tables<br/>• Foreign Key Constraints<br/>• Double-Entry Stock Ledger<br/>• Immutable Audit Tables")]
    end

    ClientLayer -->|HTTP/HTTPS Requests| GatewayLayer
    GatewayLayer -->|Reverse Proxy /api/v1/| APILayer
    APILayer --> AuthMiddleware
    AuthMiddleware --> ValidationMiddleware
    ValidationMiddleware --> CorrelationMiddleware
    CorrelationMiddleware --> DomainModules
    DomainModules --> Prisma
    Prisma --> Postgres
```

---

## 6. Folder Structure

```
order-to-audit/
├── backend/                       # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                # Environment variables, RBAC permissions, seller config
│   │   ├── middleware/            # Auth guard, error handler, request logger, Zod validator
│   │   ├── modules/               # Domain-Driven bounded contexts
│   │   │   ├── audit/             # Security and operational audit log service
│   │   │   ├── auth/              # Login, token generation, password hashing, session
│   │   │   ├── finance/           # AR ledger, customer payments, production costing
│   │   │   ├── health/            # Liveness, readiness, and diagnostic health probes
│   │   │   ├── inventory/         # Stock balances, movements, WAC calculator, ledger
│   │   │   ├── master-data/       # Customers, suppliers, products, BOM master, pricing
│   │   │   ├── production/        # BOM execution, production runs, scrap and yield
│   │   │   ├── reports/           # 17 statutory reports, BI dashboards, CSV exporter
│   │   │   └── sales/             # Orders, admin review, GST tax invoices, dispatches
│   │   ├── routes/                # Centralized Express API v1 router
│   │   ├── services/              # Prisma client and database connectivity
│   │   ├── utils/                 # AppError, typed apiResponse, security crypto utilities
│   │   ├── app.ts                 # Express application pipeline
│   │   └── server.ts              # HTTP bootstrap and graceful shutdown lifecycle
│   ├── prisma/
│   │   ├── migrations/            # SQL migration scripts
│   │   ├── schema.prisma          # Complete 36-entity PostgreSQL database schema
│   │   └── seed.ts                # Production benchmark master data seeder
│   ├── Dockerfile                 # Multi-stage production container build
│   └── package.json
├── frontend/                      # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/            # Reusable UI badges, cards, stats, and dialogs
│   │   ├── context/               # React Authentication & User context
│   │   ├── layouts/               # AppLayout (Sidebar + Header) and AuthLayout
│   │   ├── pages/                 # Role dashboards, inventory, production, sales, finance, reports
│   │   ├── services/              # Axios HTTP client, API service abstractions
│   │   ├── types/                 # TypeScript interfaces for API and domain DTOs
│   │   ├── App.tsx                # Master routing tree with protected role redirects
│   │   └── main.tsx               # Application entrypoint
│   ├── nginx.conf                 # Production Nginx reverse proxy & SPA fallback
│   ├── Dockerfile                 # Multi-stage build (Vite build -> Nginx Alpine)
│   └── package.json
├── docs/                          # Comprehensive Technical & Deployment Documentation
│   ├── DESIGN_NOTE.md             # 2-Page Technical Design Note
│   ├── DEMO_PLAN.md               # 8-Minute Video Demonstration Plan & Script
│   ├── HOSTING_GUIDE.md           # AWS EC2 / Cloud Hosting Runbook
│   └── DATABASE_SETUP.md          # Database migration & schema initialization guide
├── scripts/                       # DevOps & Operational Automation Scripts
│   ├── backup-database.sh         # Linux / EC2 automated pg_dump with retention purge
│   ├── backup-database.ps1        # Windows PowerShell automated backup script
│   ├── restore-database.sh        # Point-in-time PostgreSQL restore utility
│   └── deploy-ec2.sh              # One-click AWS EC2 server setup and deployment
├── tests/                         # Full Integration & Benchmark Regression Suite
│   ├── master-data.test.ts        # 58 Master data tests
│   ├── inventory-purchase.test.ts # 171 Inventory and purchasing tests
│   ├── production-bom.test.ts     # 55 Production and BOM tests
│   ├── sales-dispatch.test.ts     # 67 Sales and dispatch tests
│   ├── payment-costing.test.ts    # 50 Payment and costing tests
│   ├── reports-bi.test.ts         # 109 BI and statutory report tests
│   └── e2e-benchmark-validation.test.ts # 64 Mandatory benchmark tests (TEST 1 to 12)
├── docker-compose.yml             # Local / Development Docker Compose orchestration
├── docker-compose.prod.yml        # Production Docker Compose orchestration
├── .env.example                   # Local environment variable template
├── .env.production.example        # Production environment variable template
└── README.md                      # Authoritative Project Documentation
```

---

## 7. Database Schema

The database architecture is built upon PostgreSQL 16 and Prisma ORM, containing 36 relational models with foreign-key constraints, unique indexes, and audit timestamps:

| Table Name | Primary Purpose & Key Fields |
|:---|:---|
| `users` | Corporate users with bcrypt credentials, activation state, and contact details |
| `roles` & `user_roles` | System roles (`OWNER`, `ADMIN`, `SALESMAN`, `SUPERVISOR`, `ACCOUNTANT`, `AUDITOR`) |
| `customers` | Commercial clients with business name, customer type, GSTIN, and state code |
| `suppliers` | Raw material and packaging vendors with GSTIN, contact, and credit terms |
| `products` | Commercial finished goods with pack size, HSN code, GST rate, and status |
| `product_categories` | Hierarchical categorizations for finished goods and components |
| `raw_materials` | Ingredients with material code, unit, reorder level, and purchase rate |
| `packaging_materials` | Pouches, master cartons, labels, and sealing consumables |
| `units` & `unit_conversions` | Metric conversion mappings (KG $\leftrightarrow$ G, LTR $\leftrightarrow$ ML, Cartons $\leftrightarrow$ Packets) |
| `selling_prices` | Tiered pricing rules for Retailers, Wholesalers, and State Distributors |
| `bom_masters` & `bom_items` | Multi-level Bill of Materials with gross/net ratios and scrap allowances |
| `inventory_items` | Stock partitions across 4 categories with real-time on-hand balances and WAC |
| `stock_ledger` | Immutable double-entry inventory ledger with source document linkages |
| `purchase_entries` | Supplier purchases, GRN receipts, tax breakdowns, and payment status |
| `production_runs` | Manufacturing batch orders with planned vs actual output and cost records |
| `production_outputs` | Actual good commercial output, damaged pouches, and scrap records |
| `sales_orders` & `order_items`| Sales orders with customer pricing, salesman scoping, and approval status |
| `gst_invoices` & `invoice_items`| Statutory GST tax invoices with CGST/SGST/IGST breakdown and payment status |
| `delivery_challans` | Physical dispatch documents triggering inventory balance deductions |
| `customer_payments` | Bank, NEFT, RTGS, and cheque customer payment receipts |
| `payment_allocations` | FIFO or specific invoice-level settlement distribution records |
| `audit_logs` | Immutable audit trail capturing user, action type, IP address, and payload diff |

---

## 8. Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : grants
    USERS ||--o{ SALES_ORDERS : creates
    CUSTOMERS ||--o{ SALES_ORDERS : receives
    CUSTOMERS ||--o{ CUSTOMER_PAYMENTS : pays
    SUPPLIERS ||--o{ PURCHASE_ENTRIES : fulfills
    PRODUCTS ||--|| BOM_MASTERS : defines
    PRODUCTS ||--o{ SELLING_PRICES : priced_at
    PRODUCTS ||--o{ SALES_ORDER_ITEMS : contains
    BOM_MASTERS ||--o{ BOM_ITEMS : specifies
    RAW_MATERIALS ||--o{ BOM_ITEMS : input_ingredient
    PACKAGING_MATERIALS ||--o{ BOM_ITEMS : input_packaging
    PRODUCTION_RUNS ||--o{ PRODUCTION_OUTPUTS : yields
    PRODUCTION_RUNS ||--o{ STOCK_LEDGER : issues_materials
    SALES_ORDERS ||--|| GST_INVOICES : bills
    SALES_ORDERS ||--o{ DELIVERY_CHALLANS : dispatches
    DELIVERY_CHALLANS ||--o{ STOCK_LEDGER : decrements_fg
    GST_INVOICES ||--o{ PAYMENT_ALLOCATIONS : settled_by
    CUSTOMER_PAYMENTS ||--o{ PAYMENT_ALLOCATIONS : allocates
    INVENTORY_ITEMS ||--o{ STOCK_LEDGER : tracks_history
    USERS ||--o{ AUDIT_LOGS : performs
```

---

## 9. Installation Instructions

### Prerequisites
- **Node.js**: v20.x or later
- **npm**: v10.x or later
- **Docker & Docker Compose**: Docker Engine 24+ with Compose v2
- **Git**

### Option A: Complete Docker Deployment (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/order-to-audit-erp.git
   cd order-to-audit-erp
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Build and start all services**:
   ```bash
   docker compose up --build -d
   ```

4. **Verify container status**:
   ```bash
   docker compose ps
   ```

5. **Access Application**:
   - **Frontend Web Application**: [http://localhost:5173](http://localhost:5173) (or [http://localhost](http://localhost) in production mode)
   - **Backend API & Health**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
   - **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: ordertoaudit_erp`)

---

### Option B: Bare-Metal Local Development

1. **Install Root Dependencies**:
   ```bash
   npm install
   ```

2. **Start PostgreSQL Container**:
   ```bash
   docker compose up -d postgres
   ```

3. **Initialize Database Schema & Seeds**:
   ```bash
   npm run prisma:migrate --workspace=backend
   npm run prisma:seed --workspace=backend
   ```

4. **Launch Development Servers**:
   ```bash
   # Starts backend on 5000 and frontend on 5173 concurrently
   npm run dev
   ```

---

## 10. Environment Variables

| Variable Name | Environment | Default Value | Description |
|:---|:---:|:---:|:---|
| `NODE_ENV` | All | `development` | Operational environment (`development`, `test`, `production`) |
| `PORT` | Backend | `5000` | Port on which the Express HTTP server listens |
| `DATABASE_URL` | Backend | `postgresql://...` | PostgreSQL connection string including connection pooling parameters |
| `CORS_ORIGIN` | Backend | `http://localhost:5173` | Comma-separated whitelist of allowed client origins |
| `JWT_SECRET` | Backend | *Random Secret* | 32+ character cryptographic secret for signing JWT access tokens |
| `JWT_EXPIRES_IN`| Backend | `8h` | Lifetime duration for access tokens (`15m`, `8h`, etc.) |
| `LOG_LEVEL` | Backend | `debug` | Logging granularity (`error`, `warn`, `info`, `debug`) |
| `VITE_API_URL` | Frontend | `http://localhost:5000/api/v1` | Base URL used by Axios client to communicate with backend |

---

## 11. API Documentation

### Authentication & Authorization
- `POST /api/v1/auth/login`: Authenticate with email/password; returns JWT, user profile, and role redirect URL.
- `POST /api/v1/auth/refresh`: Refresh expired access token using secure refresh token.
- `POST /api/v1/auth/logout`: Invalidate session tokens.

### Health Probes
- `GET /api/v1/health`: Full system diagnostics (memory usage, database connection status, latency).
- `GET /api/v1/health/live`: Lightweight liveness probe for Kubernetes and Docker healthchecks.
- `GET /api/v1/health/ready`: Readiness probe verifying PostgreSQL connection availability.
- `GET /api/v1/health/ping`: Heartbeat probe returning HTTP 200 `pong`.

### Master Data Management
- `GET /api/v1/master/customers`: List customers with search, status filters, and pagination.
- `POST /api/v1/master/customers`: Create new customer with GSTIN and state validation.
- `GET /api/v1/master/suppliers`: List raw material and packaging suppliers.
- `GET /api/v1/master/products`: List finished goods products.
- `GET /api/v1/master/bom`: List Bill of Materials master formulas.
- `GET /api/v1/master/export/:type`: Stream bulk CSV export of master data entities.

### Inventory & Purchasing
- `GET /api/v1/inventory/items`: Fetch on-hand balances across all 4 categories.
- `GET /api/v1/inventory/ledger`: Fetch complete historical double-entry stock ledger.
- `POST /api/v1/inventory/purchases`: Record new Goods Receipt Note (GRN) from vendor.
- `POST /api/v1/inventory/movements`: Record stock movements with mandatory source document linkage.

### Production & BOM
- `GET /api/v1/production/runs`: List production batch runs.
- `POST /api/v1/production/runs`: Initiate a new production run against a product BOM version.
- `POST /api/v1/production/runs/:id/complete`: Post production run, consume ingredients, credit finished goods.

### Sales & Dispatch
- `GET /api/v1/sales/orders`: List orders (scoped to salesman for field roles).
- `POST /api/v1/sales/orders`: Submit new sales order from mobile or desktop view.
- `PATCH /api/v1/sales/orders/:id/approve`: Admin approval of submitted order.
- `POST /api/v1/sales/orders/:id/invoice`: Generate statutory GST tax invoice.
- `POST /api/v1/sales/orders/:id/dispatch`: Generate Delivery Challan and decrement physical inventory.

### Finance, Costing & Accounts Receivable
- `GET /api/v1/finance/receivables`: Real-time receivables summary and ageing buckets.
- `POST /api/v1/finance/payments`: Record customer payment and allocate to invoices.
- `GET /api/v1/finance/costing/runs/:id`: Calculate Ind AS 2 absorption costing per good packet.

### Business Intelligence & Reporting Hub
- `GET /api/v1/reports/sales-register`: Taxable sales register with tax breakdown.
- `GET /api/v1/reports/gst-outward`: GSTR-1 outward supplies summary.
- `GET /api/v1/reports/purchase-register`: GRN purchase receipts register.
- `GET /api/v1/reports/stock-summary`: Partitioned stock summaries by category.
- `GET /api/v1/reports/production-variance`: Material planned vs actual consumption variance alerts.
- `GET /api/v1/reports/audit-trail`: Immutable system and security audit logs.
- `GET /api/v1/reports/export/csv`: Dynamic CSV streaming of any report.

---

## 12. Module Descriptions

1. **Master Data Module**: Manages products, categories, customers, suppliers, units, unit conversions, price tiers, and Bill of Materials master records.
2. **Inventory Management Module**: Enforces strict physical isolation across Raw Materials, Packaging, WIP, and Finished Goods. Recomputes Moving Weighted-Average Cost on every purchase and prevents negative balances.
3. **Purchasing Module**: Records vendor purchases, captures supplier GSTIN, records lot quantities, and updates raw material stock balances upon GRN verification.
4. **BOM & Production Module**: Formulates standard input-output ratios, manages versioned recipes, captures operational scrap, and posts ledger transactions automatically.
5. **Salesman Mobile Module**: Responsive viewport-tailored order capture interface allowing salesmen to query approved product catalogs and submit orders in real time.
6. **Order Governance & Invoicing Module**: Admin review queue, stock pre-validation, statutory GST tax calculation (intra-state vs inter-state), and immutable posted invoice rules.
7. **Warehouse Dispatch Module**: Issues Delivery Challans and decrements physical finished goods only upon verified dispatch from warehouse.
8. **Finance & Payment Module**: Manages accounts receivable ledgers, partial payment settlements, over-allocation guards, and debtor ageing analysis (0–30, 31–60, 61–90, >90 days).
9. **Production Costing Engine**: Implements Ind AS 2 absorption costing, allocating direct materials at prevailing WAC and apportioning labor and utility overheads across sound commercial units.
10. **Reporting & BI Hub**: Serves 17 statutory and management reports, executive dashboards for Owners and Admins, and universal CSV streaming.
11. **Security Audit Module**: Captures tamper-evident records of all system mutations with user context, IP address, and payload diffs.

---

## 13. User Roles & Permission Matrix

| Module / Operation | OWNER | ADMIN | SALESMAN | PROD SUPERVISOR | ACCOUNTANT | AUDITOR |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Executive Dashboards** | Full Access | Full Access | Own Sales Only | Prod Only | Financial Only | Read-Only |
| **Master Data Management** | Read / Write | Read / Write | Read-Only | Read-Only | Read-Only | Read-Only |
| **Vendor Purchase (GRN)** | Full Access | Full Access | No Access | Read-Only | Read-Only | Read-Only |
| **Inventory Movements** | Full Access | Full Access | No Access | Issue / Scrap | Read-Only | Read-Only |
| **BOM & Production Runs** | Full Access | Full Access | No Access | Create / Post | Read-Only | Read-Only |
| **Sales Order Creation** | Full Access | Full Access | Own Customers | No Access | No Access | Read-Only |
| **Sales Order Approval** | Full Access | Full Access | No Access | No Access | No Access | Read-Only |
| **GST Invoice Generation**| Full Access | Full Access | No Access | **Blocked** | View Only | Read-Only |
| **Physical Dispatch (DC)** | Full Access | Full Access | No Access | Full Access | No Access | Read-Only |
| **Payment Collections** | Full Access | Full Access | View Own AR | No Access | Full Access | Read-Only |
| **Modify Transactions** | Restricted | Restricted | **Blocked** | **Blocked** | **Blocked** | **Blocked** |
| **Statutory Reports & Audit**| Full Access | Full Access | No Access | No Access | Full Access | Full Access |

---

## 14. Benchmark Scenario (TEST 1 to TEST 12)

The system's correctness is validated against a 12-stage end-to-end manufacturing benchmark:
- **TEST 1 (Initial Data)**: Establish opening stock for Murukku 200g production: Flour 100 kg, Oil 30 L, Spice 5 kg, Pouches 500 pcs, Cartons 30 pcs, Finished Murukku 50 packets.
- **TEST 2 (Flour Purchase)**: Receive 60 kg Raw Rice Flour @ ₹45/kg from Cauvery Agro. Verify Flour stock = 160 kg and WAC updates to ₹43.125/kg.
- **TEST 3 (Production Run)**: Issue Flour 40 kg, Oil 10.5 L (0.5 L variance), Spice 1.2 kg, Cartons 9 pcs. Output: 188 good packets, 6 damaged pouches. Verify balances: Flour 120 kg, Oil 19.5 L, Spice 3.8 kg, Pouches 306 pcs, Cartons 21 pcs, Finished Goods 238 packets.
- **TEST 4 (Salesman A Order)**: Salesman A logs in via mobile view and orders 150 packets for Retailer A (Tamil Nadu) @ ₹50/packet. Order submitted and approved by Admin.
- **TEST 5 (GST Invoice)**: Generate invoice `INV-2026-00101`. Taxable = ₹7,500.00; CGST 2.5% = ₹187.50; SGST 2.5% = ₹187.50; Total = ₹7,875.00.
- **TEST 6 (Dispatch)**: Dispatch 150 packets via Delivery Challan. Verify physical finished goods stock drops from 238 to 88 packets.
- **TEST 7 (Salesman B Stock Shortage)**: Salesman B creates order for Distributor B (Karnataka) for 120 packets. Warehouse verifies stock = 88 packets, identifies 32-packet shortage, and prevents unauthorized dispatch.
- **TEST 8 (Customer Payment)**: Retailer A remits ₹4,000 via NEFT against `INV-2026-00101`. Verify Invoice = ₹7,875, Paid = ₹4,000, Outstanding = ₹3,875, status `PARTIALLY_PAID`.
- **TEST 9 (Production Costing)**: Calculate direct material cost (₹4,108.50) and overheads (Labour ₹1,200, Gas/Power ₹600). Allocate over 188 good units $\rightarrow$ Cost per good packet = ₹31.43.
- **TEST 10 (Report Generation)**: Generate Sales Register, GSTR-1, Purchase Register, Stock Summaries, Stock Ledger, Production Report, Variance Report, Costing Report, and AR Report.
- **TEST 11 (Data Integrity & Invariants)**: Verify no duplicate stock movements, no negative stock, 100% source document linkage, salesman scoping, posted invoice immutability, payment over-allocation prevention, and audit logs.
- **TEST 12 (Automated Test Suite)**: Execute complete test suite and generate benchmark comparison report with 100% pass rate.

---

## 15. Benchmark Results & Mathematical Verification

### Summary: 64 Benchmark Invariants Evaluated — 64 PASSED (100% Pass Rate)

| Test ID | Parameter / System Invariant | Expected Result | Actual App Result | Status | Verification Detail & Formula |
|:---|:---|:---:|:---:|:---:|:---|
| **TEST 1** | Opening Stock: Flour Balance | 100.00 kg | 100.00 kg | **PASS** | Credited via `TXN-OPN-0001` |
| **TEST 1** | Opening Stock: Oil Balance | 30.00 L | 30.00 L | **PASS** | Credited via `TXN-OPN-0002` |
| **TEST 1** | Opening Stock: Spice Mix | 5.00 kg | 5.00 kg | **PASS** | Credited via `TXN-OPN-0003` |
| **TEST 1** | Opening Stock: Pouches (200g) | 500 pcs | 500 pcs | **PASS** | Credited via `TXN-OPN-0004` |
| **TEST 1** | Opening Stock: Master Cartons | 30 pcs | 30 pcs | **PASS** | Credited via `TXN-OPN-0005` |
| **TEST 1** | Opening Stock: Finished Murukku | 50 pkts | 50 pkts | **PASS** | Credited via `TXN-OPN-0006` |
| **TEST 2** | Flour Purchase Quantity | 60.00 kg | 60.00 kg | **PASS** | GRN received from Cauvery Agro |
| **TEST 2** | Post-Purchase Flour Stock | 160.00 kg | 160.00 kg | **PASS** | $100\text{ kg} + 60\text{ kg} = 160.00\text{ kg}$ |
| **TEST 2** | Flour Weighted-Average Cost | ₹43.125 / kg | ₹43.125 / kg | **PASS** | $\frac{(100 \times ₹42) + (60 \times ₹45)}{160} = ₹43.125/\text{kg}$ |
| **TEST 3** | Flour Production Issue | 40.00 kg | 40.00 kg | **PASS** | Issued to batch `RUN-2026-00101` |
| **TEST 3** | Post-Production Flour Stock | 120.00 kg | 120.00 kg | **PASS** | $160\text{ kg} - 40\text{ kg} = 120.00\text{ kg}$ |
| **TEST 3** | Oil Production Issue | 10.50 L | 10.50 L | **PASS** | Includes 0.5 L operational variance |
| **TEST 3** | Post-Production Oil Stock | 19.50 L | 19.50 L | **PASS** | $30.0\text{ L} - 10.5\text{ L} = 19.50\text{ L}$ |
| **TEST 3** | Spice Mix Production Issue | 1.20 kg | 1.20 kg | **PASS** | Actual batch issue recorded |
| **TEST 3** | Post-Production Spice Stock | 3.80 kg | 3.80 kg | **PASS** | $5.0\text{ kg} - 1.2\text{ kg} = 3.80\text{ kg}$ |
| **TEST 3** | Pouches Packaging Issue | 194 pcs | 194 pcs | **PASS** | 188 sound + 6 damaged pouches |
| **TEST 3** | Post-Production Pouches Stock | 306 pcs | 306 pcs | **PASS** | $500\text{ pcs} - 194\text{ pcs} = 306\text{ pcs}$ |
| **TEST 3** | Cartons Packaging Issue | 9 pcs | 9 pcs | **PASS** | Packing cartons consumed |
| **TEST 3** | Post-Production Cartons Stock | 21 pcs | 21 pcs | **PASS** | $30\text{ pcs} - 9\text{ pcs} = 21\text{ pcs}$ |
| **TEST 3** | Good Commercial Output | 188 pkts | 188 pkts | **PASS** | Sound commercial packets verified |
| **TEST 3** | Post-Production Finished Stock | 238 pkts | 238 pkts | **PASS** | $50\text{ opening} + 188\text{ output} = 238\text{ pkts}$ |
| **TEST 4** | Sales Order: Customer | Retailer A | Retailer A | **PASS** | Intra-state customer (Tamil Nadu, 33) |
| **TEST 4** | Sales Order: Ordered Quantity | 150 pkts | 150 pkts | **PASS** | Murukku 200g commercial units |
| **TEST 4** | Sales Order: Unit Price | ₹50.00 | ₹50.00 | **PASS** | Contract price for Retailer tier |
| **TEST 4** | Sales Order Status | `SUBMITTED` | `SUBMITTED` | **PASS** | Submitted by Salesman A |
| **TEST 4** | Admin Approval Status | `APPROVED` | `APPROVED` | **PASS** | Approved by Admin |
| **TEST 5** | GST Invoice: Taxable Base | ₹7,500.00 | ₹7,500.00 | **PASS** | $150\text{ pkts} \times ₹50.00 = ₹7,500.00$ |
| **TEST 5** | Statutory CGST Amount (2.5%) | ₹187.50 | ₹187.50 | **PASS** | $₹7,500.00 \times 2.5\% = ₹187.50$ |
| **TEST 5** | Statutory SGST Amount (2.5%) | ₹187.50 | ₹187.50 | **PASS** | $₹7,500.00 \times 2.5\% = ₹187.50$ |
| **TEST 5** | Statutory IGST Amount (0.0%) | ₹0.00 | ₹0.00 | **PASS** | Zero IGST for intra-state supply |
| **TEST 5** | GST Invoice Grand Total | ₹7,875.00 | ₹7,875.00 | **PASS** | $₹7,500.00 + ₹187.50 + ₹187.50 = ₹7,875.00$ |
| **TEST 6** | Delivery Challan Dispatch Qty | 150 pkts | 150 pkts | **PASS** | Dispatched via `DC-2026-00101` |
| **TEST 6** | Stock Decrement Timing | On Dispatch | On Dispatch | **PASS** | Decrements only on DC dispatch |
| **TEST 6** | Post-Dispatch Finished Stock | 88 pkts | 88 pkts | **PASS** | $238\text{ pkts} - 150\text{ pkts} = 88\text{ pkts}$ |
| **TEST 7** | Inter-State Order: Distributor B | 120 pkts | 120 pkts | **PASS** | Created for Karnataka customer |
| **TEST 7** | Available Inventory Detected | 88 pkts | 88 pkts | **PASS** | System checks current on-hand balance |
| **TEST 7** | Inventory Shortage Identified | 32 pkts | 32 pkts | **PASS** | Shortage: $120 - 88 = 32\text{ packets}$ |
| **TEST 7** | Unauthorized Dispatch Guard | `BLOCKED` | `BLOCKED` | **PASS** | Negative stock strictly prohibited |
| **TEST 7** | Stock Preserved After Rejection| 88 pkts | 88 pkts | **PASS** | Balance remains preserved at 88 |
| **TEST 8** | Retailer A Invoiced Total | ₹7,875.00 | ₹7,875.00 | **PASS** | Invoiced gross receivable |
| **TEST 8** | Payment Realized & Allocated | ₹4,000.00 | ₹4,000.00 | **PASS** | Allocated to `INV-2026-00101` |
| **TEST 8** | Invoice Outstanding Balance | ₹3,875.00 | ₹3,875.00 | **PASS** | $₹7,875.00 - ₹4,000.00 = ₹3,875.00$ |
| **TEST 8** | Post-Payment Invoice Status | `PARTIALLY_PAID`| `PARTIALLY_PAID`| **PASS** | Status updated |
| **TEST 9** | Direct Labour Overheads | ₹1,200.00 | ₹1,200.00 | **PASS** | Direct shift labor expense |
| **TEST 9** | Gas & Power Overheads | ₹600.00 | ₹600.00 | **PASS** | Process energy expense |
| **TEST 9** | Total Manufacturing Overheads | ₹1,800.00 | ₹1,800.00 | **PASS** | $₹1,200.00 + ₹600.00 = ₹1,800.00$ |
| **TEST 9** | Total Direct Material Cost | ₹4,108.50 | ₹4,108.50 | **PASS** | Sum of actual RM & PM at WAC |
| **TEST 9** | Total Batch Production Cost | ₹5,908.50 | ₹5,908.50 | **PASS** | Materials + Overheads |
| **TEST 9** | Cost Per Good Packet (188 pkts)| ₹31.43 / pkt | ₹31.43 / pkt | **PASS** | $\frac{₹5,908.50}{188} = ₹31.4282 \approx ₹31.43$ |
| **TEST 10** | Sales Register: Invoices Count | 2 Invoices | 2 Invoices | **PASS** | Retailer A + Distributor B |
| **TEST 10** | Sales Register: Total Revenue | ₹13,734.00 | ₹13,734.00 | **PASS** | Invoice A ($₹7,875$) + Invoice B ($₹5,859$) |
| **TEST 10** | GST Report: Intra Taxable Base | ₹7,500.00 | ₹7,500.00 | **PASS** | Intra-state supply base |
| **TEST 10** | GST Report: Inter Taxable Base | ₹5,580.00 | ₹5,580.00 | **PASS** | Inter-state supply base ($120 \times ₹46.50$) |
| **TEST 10** | GST Report: Total Tax Collected| ₹654.00 | ₹654.00 | **PASS** | CGST ₹187.50 + SGST ₹187.50 + IGST ₹279 |
| **TEST 10** | Purchase Register: GRNs | 2 GRNs | 2 GRNs | **PASS** | Verified vendor receipts |
| **TEST 10** | Stock Summary: Raw Flour | 120.00 kg | 120.00 kg | **PASS** | Closing stock reported |
| **TEST 10** | Stock Ledger: Dispatch Recorded| `true` | `true` | **PASS** | `DISPATCH_OUT` of 150 units in ledger |
| **TEST 10** | Production Report: Good Output | 188 pkts | 188 pkts | **PASS** | Commercial units reported |
| **TEST 10** | Variance Report: Oil Alert | `true` (Alert) | `true` (Alert) | **PASS** | $+5.0\%$ variance exceeds 3% threshold |
| **TEST 10** | Costing Report: Unit Cost | ₹31.43 | ₹31.43 | **PASS** | Absorption cost reported |
| **TEST 10** | Payment Report: Realized Amount| ₹4,000.00 | ₹4,000.00 | **PASS** | Collections from Retailer A |
| **TEST 10** | Outstanding Report: Retailer A | ₹3,875.00 | ₹3,875.00 | **PASS** | Net outstanding balance |
| **TEST 11** | Duplicate Movement Guard | `BLOCKED` | `BLOCKED` | **PASS** | Duplicate execution key rejected |
| **TEST 11** | Negative Stock Guard | `BLOCKED` | `BLOCKED` | **PASS** | Over-dispatch blocked |
| **TEST 11** | Source Document Linkage | 100% Linked | 100% Linked | **PASS** | All ledger movements link to PO/Run/DC |
| **TEST 11** | Salesman Cross-Access Guard | `ENFORCED` | `ENFORCED` | **PASS** | Salesman A cannot see Salesman B |
| **TEST 11** | Posted Invoice Immutability | `ENFORCED` | `ENFORCED` | **PASS** | Deletion of tax invoice rejected |
| **TEST 11** | Payment Over-Allocation Guard | `BLOCKED` | `BLOCKED` | **PASS** | Allocations > remaining balance blocked |
| **TEST 11** | Full Security Audit Trail | 100% Audited | 100% Audited | **PASS** | All lifecycle transactions logged |
| **TEST 12** | Full Test Suite Execution | 574 / 574 | 574 / 574 | **PASS** | **100% Pass Rate across all suites** |

---

## 16. Costing Methodology (Ind AS 2)

In compliance with **Indian Accounting Standard (Ind AS) 2 / International Accounting Standard (IAS) 2 (Inventories)**:
1. **Direct Material Valuation**: Every ingredient issued to production is valued at its prevailing Moving Weighted-Average Cost (WAC) at the moment of issue.
2. **Scrap & Normal Waste Absorption**: Normal production shrinkage, frying loss, and machine packaging scrap are not capitalized as assets. Instead, the net manufacturing cost is absorbed over the **sound commercial units produced**.
3. **Overhead Allocation**: Production overheads (direct labor, process gas, electrical energy) are accumulated and added directly to material costs to determine Total Production Batch Cost:
   $$\text{Total Production Cost} = \text{Direct Materials Cost} + \text{Direct Labour} + \text{Utilities Overheads}$$
   $$\text{Cost Per Good Packet} = \frac{\text{Total Production Cost}}{\text{Commercial Good Output Quantity}}$$
4. **Benchmark Proof**:
   - Total Materials Consumed: $₹4,108.50$
   - Total Overheads: $₹1,800.00$ ($₹1,200\text{ labour} + ₹600\text{ gas/power}$)
   - Total Batch Cost: $₹5,908.50$
   - Good Output: $188\text{ packets}$
   - Unit Absorption Cost: $\frac{₹5,908.50}{188} = \mathbf{₹31.4282\text{ per packet}}$ (rounded to $₹31.43$).

---

## 17. Inventory Valuation Methodology (WAC)

All inventory movements for raw materials and packaging materials utilize the **Perpetual Moving Weighted-Average Cost** method:
$$\text{WAC}_{\text{new}} = \frac{(S_{\text{existing}} \times \text{WAC}_{\text{existing}}) + (Q_{\text{receipt}} \times P_{\text{purchase}})}{S_{\text{existing}} + Q_{\text{receipt}}}$$

- **Perpetual Ledger Update**: WAC is recomputed dynamically upon confirmation of every Goods Receipt Note (GRN).
- **Issue Valuation**: Materials issued to production runs or scrap write-offs are relieved from inventory at the currently active WAC without altering the average rate.
- **Finished Goods Receipt**: Finished goods enter inventory at the calculated unit production absorption cost from the completed production run.

---

## 18. Known Limitations

1. **Multi-Currency Processing**: Current invoicing and pricing models operate in Indian Rupees (INR, ₹). Multi-currency conversion for foreign export orders is scheduled for future releases.
2. **Automated E-Way Bill Portal Sync**: While GST invoices and Delivery Challans capture distance and transporter vehicle numbers, direct API integration with the NIC E-Way Bill portal requires enterprise production credentials.
3. **Barcode / RFID Scanner Integration**: Physical stock receipts and dispatches currently utilize alphanumeric codes and Delivery Challan IDs; native GS1 barcode camera scanning is planned for mobile enhancements.

---

## 19. Future Enhancements

1. **AI-Powered Demand Forecasting**: Predictive machine-learning models analyzing historical order patterns and seasonal festivals (e.g. Diwali murukku demand) to optimize raw material reorder triggers.
2. **IoT Production Floor Telemetry**: Direct integration with factory PLC sensors and industrial smart meters to automate gas and power overhead logging per batch.
3. **Automated WhatsApp Order Notification**: Instant dispatch tracking updates and PDF GST invoice delivery via WhatsApp Business API for retail store owners.
4. **GST E-Invoicing Real-Time Clearance**: Native JSON payload generation for automatic submission to the Goods and Services Tax Network (GSTN) Invoice Registration Portal (IRP).

---

## 20. Test Login Credentials

The development and production database seeders configure dedicated test credentials for all six system roles. All passwords conform to enterprise complexity requirements:

| Role | Email Address | Password | Dedicated Default View | Primary Responsibilities |
|:---|:---|:---|:---|:---|
| **Owner** | `owner@enterprise.com` | `Owner@Secure2026!` | `/dashboard/owner` | Executive revenue, cash flow, stock health, profit margins |
| **Admin** | `admin@enterprise.com` | `Admin@Secure2026!` | `/dashboard/admin` | Operational workflows, order approvals, user management |
| **Salesman A** | `salesman.a@enterprise.com` | `Sales@Secure2026!` | `/sales/mobile` | Retailer order creation (Tamil Nadu region) |
| **Salesman B** | `salesman.b@enterprise.com` | `Sales@Secure2026!` | `/sales/mobile` | Distributor order creation (Karnataka region) |
| **Production Supervisor**| `supervisor@enterprise.com` | `Prod@Secure2026!` | `/dashboard/production`| BOM batch runs, material issues, output & scrap records |
| **Accountant** | `accountant@enterprise.com` | `Account@Secure2026!`| `/finance/payments` | Customer payment receipts, AR settlement, costing analysis |
| **Auditor** | `auditor@enterprise.com` | `Audit@Secure2026!` | `/reports` | Read-only inspection of statutory registers & security audit trail |

> **Privacy & Compliance Certification**: All entity names, customer profiles, GSTIN numbers, addresses, and transaction amounts present in this repository are synthetic benchmark representations created exclusively for evaluation purposes. No confidential or live proprietary data is included.
