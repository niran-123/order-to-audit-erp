# Order-to-Audit ERP: 8-Minute Video Demonstration Plan & Script

**Duration**: Exactly 8 Minutes (08:00)  
**Target Audience**: Technical Evaluators, Industry Mentors, Executive Auditors  
**Demonstration Scope**: End-to-End Enterprise Flow (TEST 1 to TEST 12 Benchmark Scenario)

---

## Timeline & Scene Overview

| Timestamp | Segment Title | Demonstrated Feature & Screen Flow | Speaker Cue / Narration Focus |
|:---|:---|:---|:---|
| **00:00 – 00:40** | **Project Overview & Architecture** | Architecture slide, React + Vite UI, Express API, PostgreSQL, Docker containers | High-level system introduction, problem statement, monorepo tech stack |
| **00:40 – 01:20** | **Login & Role Management** | Authentication page, JWT token creation, RBAC matrix, separate role redirects | Role-based security (Owner, Admin, Salesman, Supervisor, Accountant, Auditor) |
| **01:20 – 02:00** | **Purchase & Inventory** | Inventory Dashboard (4 stock categories), Goods Receipt Note entry, WAC update | Purchase entry: 60 kg flour @ ₹45/kg; stock goes from 100 to 160 kg, WAC = ₹43.125 |
| **02:00 – 03:10** | **BOM & Production** | BOM Master (Murukku 200g), Production Run creation, Actual issue vs Output | Run creation: Issue 40 kg flour, 10.5 L oil; Output 188 good pkts, 6 damaged pouches |
| **03:10 – 04:20** | **Salesman Mobile Order & Admin Approval** | Responsive mobile viewport, Salesman A login, Retailer A selection, Admin approval | Salesman creates 150 pkts order @ ₹50; Admin inspects and approves order |
| **04:20 – 05:10** | **GST Invoice & Dispatch** | Invoice generation (CGST 2.5%, SGST 2.5%, total ₹7,875.00), Delivery Challan | Generating statutory tax invoice; Dispatching 150 pkts decrements FG from 238 to 88 |
| **05:10 – 05:40** | **Distributor Stock Shortage** | Salesman B order: Distributor B (120 pkts), Stock check: Available 88 pkts | System detects shortage of 32 pkts; unauthorized dispatch blocked (no negative stock) |
| **05:40 – 06:20** | **Payment & Outstanding** | Finance module: Retailer A records ₹4,000 NEFT; Invoice balance drops to ₹3,875 | Invoice transitions to PARTIALLY_PAID; AR ageing bucket updated; Over-allocation blocked |
| **06:20 – 07:00** | **Cost Per Packet** | Costing analysis: Material (₹4,108.50) + Overheads (Labour ₹1,200, Power ₹600) | Ind AS 2 unit cost absorption over 188 good units = ₹31.43/packet; Margin analytics |
| **07:00 – 08:00** | **Monthly Reports & Audit Dashboard** | BI Hub (17 statutory reports), Owner / Admin Dashboards, CSV Export, Security Audit | Sales register, GSTR-1 outward tax, Stock ledger, Immutable audit logs |

---

## Detailed Script & Click-by-Click Action Plan

### Segment 1: Project Overview & Architecture (00:00 – 00:40)
- **Visual**: Display system architecture diagram (Browser / React $\rightarrow$ Express API $\rightarrow$ PostgreSQL 16 $\rightarrow$ Docker Compose).
- **Narration**: *"Welcome to the demonstration of the Order-to-Audit Enterprise Management System. In fast-moving manufacturing, disconnected spreadsheets cause untracked inventory shrinkage, incorrect GST invoices, and distorted cost calculations. We built this production-grade, monorepo ERP using React 18, TypeScript, Tailwind CSS, Node.js Express, and PostgreSQL with Prisma ORM to guarantee complete data integrity from salesman mobile order to final statutory audit."*

---

### Segment 2: Login and Role Management (00:40 – 01:20)
- **Visual**: Navigate to `http://localhost:5173/login`. Show the role switcher.
  1. Log in as **Admin** (`admin@enterprise.com` / `Admin@Secure2026!`).
  2. Display the Admin Dashboard.
  3. Show the Role-Permission Matrix: Explain that Salesmen cannot access others' orders, Production Supervisors cannot issue tax invoices, and Auditors have read-only access.
- **Narration**: *"Our authentication layer uses bcrypt-hashed credentials and signed JSON Web Tokens with cryptographically opaque refresh tokens. When logging in as Administrator, the system automatically redirects to the executive Admin console with full audit event tracing."*

---

### Segment 3: Purchase and Inventory Management (01:20 – 02:00)
- **Visual**: Click **Inventory** in sidebar.
  1. Show initial stock balances across the four segregated categories: Raw Materials (Flour 100 kg, Oil 30 L, Spice 5 kg), Packaging Materials (Pouches 500 pcs, Cartons 30 pcs), and Finished Goods (50 packets).
  2. Click **Record Purchase (GRN)**: Select supplier *Cauvery Agro Traders*, add 60 kg Raw Rice Flour at ₹45.00/kg. Submit receipt.
  3. Show that Raw Rice Flour balance increases instantly to 160.00 kg.
  4. Open Stock Ledger: Show the weighted-average cost dynamically recomputed from ₹42.00 to ₹43.125/kg.
- **Narration**: *"Inventory is partitioned into four distinct physical categories. Recording a 60 kg flour purchase at ₹45/kg automatically updates the stock ledger to 160 kg and dynamically adjusts our Moving Weighted-Average Cost to ₹43.125 per kg."*

---

### Segment 4: BOM and Production Execution (02:00 – 03:10)
- **Visual**: Navigate to **Production & BOM** module.
  1. View BOM for *Murukku 200g*: Highlight standard formulation and configured 3% packaging scrap allowance.
  2. Click **Create Production Run**: Planned output = 200 packets.
  3. Record actual issues: Flour 40 kg, Oil 10.5 L (0.5 L process variance), Spice 1.2 kg, Cartons 9 pcs.
  4. Record actual output: 188 good packets, 6 damaged pouches.
  5. Click **Complete & Post Production Run**.
  6. Return to Inventory Dashboard: Raw Flour is now 120 kg, Oil is 19.5 L, Pouches are 306 pcs, and Finished Murukku increases from 50 to 238 packets.
- **Narration**: *"The Bill of Materials defines input standards. In this production run, actual good output was 188 packets with 6 damaged pouches and a 0.5 litre oil process variance. Posting the run automatically consumes raw materials and increments finished goods to 238 packets."*

---

### Segment 5: Salesman Mobile Order and Admin Approval (03:10 – 04:20)
- **Visual**: Switch browser to mobile responsive view (iPhone 14 / 390px).
  1. Log in as **Salesman A** (`salesman.a@enterprise.com`).
  2. Select Customer: *Sri Meenakshi Traders (Retailer A, Tamil Nadu)*.
  3. Add product *Murukku 200g*, quantity = 150 packets. Note unit price is automatically ₹50.00.
  4. Submit Sales Order: Status transitions to `SUBMITTED`.
  5. Switch back to desktop view; log in as **Admin**.
  6. Open Sales Orders queue: Review order details, inspect inventory stock (238 pkts available), and click **Approve Order**.
- **Narration**: *"Salesmen use a dedicated mobile interface. Salesman A places an order for 150 packets for Retailer A in Tamil Nadu. The Admin reviews incoming orders, checks stock availability, and approves the order for invoicing."*

---

### Segment 6: GST Invoice Generation and Dispatch (04:20 – 05:10)
- **Visual**: Click **Generate GST Invoice** on approved Order A.
  1. Display generated invoice document (`INV-2026-00101`).
  2. Verify calculation: Taxable Base = ₹7,500.00; CGST 2.5% = ₹187.50; SGST 2.5% = ₹187.50; Grand Total = ₹7,875.00.
  3. Note that physical finished goods stock remains 238 packets (no premature decrement).
  4. Click **Dispatch via Delivery Challan**: Enter 150 packets and dispatch.
  5. Show Inventory balance: Finished Goods decrements to exactly 88 packets.
- **Narration**: *"Generating statutory GST invoice INV-2026-00101 computes 2.5% CGST and SGST for intra-state supply, totaling ₹7,875. Crucially, finished goods stock decreases only when the Delivery Challan is dispatched, bringing our warehouse balance to 88 packets."*

---

### Segment 7: Distributor Stock Shortage & Guardrail (05:10 – 05:40)
- **Visual**: Log in as **Salesman B** (`salesman.b@enterprise.com`).
  1. Create order for *Cauvery Supermart (Distributor B, Karnataka)* for 120 packets.
  2. Admin approves order.
  3. Warehouse Supervisor attempts to dispatch full 120 packets.
  4. The system triggers a red validation block: *'Dispatch Failed: Requested 120 packets exceeds available inventory (88 packets). Shortage: 32 packets.'*
  5. Show that stock remains preserved at 88 packets (negative inventory prevented).
- **Narration**: *"When Salesman B attempts to dispatch 120 packets for Distributor B, the ERP verifies on-hand inventory, identifies a 32-packet shortage, and strictly blocks the dispatch, preserving stock integrity and preventing negative balances."*

---

### Segment 8: Customer Payment and Accounts Receivable (05:40 – 06:20)
- **Visual**: Navigate to **Finance & Accounts Receivable**.
  1. Select Customer *Retailer A*. Show outstanding balance = ₹7,875.00.
  2. Click **Record Payment**: Amount = ₹4,000.00, Method = NEFT, Reference = `NEFT-HDFC-991244`. Allocate to `INV-2026-00101`. Submit.
  3. Show updated invoice status: `PARTIALLY_PAID` with remaining balance ₹3,875.00.
  4. Attempt over-allocation: Try recording ₹10,000 payment against the ₹3,875 invoice; system rejects with 400 Bad Request.
  5. Show Accounts Receivable Ageing analysis (100% current within 0–30 days).
- **Narration**: *"Retailer A remits ₹4,000 via NEFT. The payment is allocated to the invoice, updating its status to Partially Paid with ₹3,875 remaining. Strict accounting guards prevent accidental or fraudulent over-allocation."*

---

### Segment 9: Production Costing Analysis (06:20 – 07:00)
- **Visual**: Open **Production Costing** module.
  1. Inspect batch costing for run `RUN-2026-00101`.
  2. Show direct material cost = ₹4,108.50.
  3. Show manufacturing overheads: Direct Labour = ₹1,200.00; Gas & Power = ₹600.00; Total Overheads = ₹1,800.00.
  4. Total Batch Cost = ₹5,908.50.
  5. Show Ind AS 2 Unit Cost calculation: $₹5,908.50 \div 188\text{ good packets} = \mathbf{₹31.43\text{ per packet}}$.
  6. Show product profitability tier: Retailer margin = ₹18.57 (37.1%); Distributor margin = ₹15.07 (32.4%).
- **Narration**: *"Following Ind AS 2, total batch costs of ₹5,908.50—including ₹1,800 in labour and power—are absorbed over the 188 good commercial units, establishing an exact unit cost of ₹31.43 per packet."*

---

### Segment 10: Reports Hub and Security Audit Dashboard (07:00 – 08:00)
- **Visual**: Navigate to **Reports & BI Hub**.
  1. Open **Sales Register**: Display total revenue ₹13,734.00 across both invoices.
  2. Open **GST Outward Supplies (GSTR-1)**: Show breakdown of Intra-state (₹7,500) and Inter-state (₹5,580), and total tax collected (₹654.00).
  3. Open **Stock Ledger**: Review complete audit trail of receipts, issues, and dispatches.
  4. Click **Export CSV** on Sales Register to demonstrate instant data portability.
  5. Navigate to **Security Audit Log**: Show tamper-evident records of every login, invoice posting, and payment.
- **Narration**: *"Our comprehensive BI hub generates 17 statutory and management reports with instant CSV export. The security audit log captures an immutable record of every user action and transaction, providing full compliance for statutory auditors. Thank you for reviewing the Order-to-Audit ERP."*
