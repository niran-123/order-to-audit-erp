<#
.SYNOPSIS
  Order-to-Audit ERP - PowerShell Git Commit Sequence Script
.DESCRIPTION
  Automates the creation of a clean, structured, conventional commit history.
#>

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Creating Structured Git Commit History for Final Submission" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Monorepo core & tooling
git add .gitignore .eslintrc.json .prettierrc .prettierignore package.json package-lock.json tsconfig.json docker-compose.yml .env.example
git commit -m "feat(core): initialize monorepo architecture, Docker Compose, and code quality tooling"

# 2. Authentication & RBAC
git add backend/prisma backend/src/config backend/src/services backend/src/utils backend/src/middleware backend/src/modules/health backend/src/modules/audit backend/src/modules/auth backend/src/app.ts backend/src/server.ts backend/package.json backend/tsconfig.json
git commit -m "feat(auth): implement JWT authentication, password hashing, and role-based permissions"

# 3. Master Data
git add backend/src/modules/master-data tests/master-data.test.ts
git commit -m "feat(master-data): implement customer, supplier, product, BOM, and pricing tier management"

# 4. Inventory & Purchasing
git add backend/src/modules/inventory tests/inventory-purchase.test.ts
git commit -m "feat(inventory): implement 4-category stock balance, GRN receipts, and double-entry stock ledger"

# 5. Production & BOM
git add backend/src/modules/production tests/production-bom.test.ts
git commit -m "feat(production): implement BOM execution, scrap allowance, and automatic ledger updates"

# 6. Sales & Dispatch
git add backend/src/modules/sales tests/sales-dispatch.test.ts
git commit -m "feat(sales): implement salesman mobile ordering, admin review, GST tax billing, and dispatch"

# 7. Finance & Costing
git add backend/src/modules/finance tests/payment-costing.test.ts
git commit -m "feat(finance): implement payment allocation, AR ageing, and Ind AS 2 production costing"

# 8. Reports & BI Hub
git add backend/src/modules/reports tests/reports-bi.test.ts backend/src/routes
git commit -m "feat(reports): implement 17 statutory and BI reports, executive dashboards, and CSV export"

# 9. Frontend Application
git add frontend/
git commit -m "feat(frontend): implement responsive React 18 SPA with Tailwind CSS, role dashboards, and mobile order capture"

# 10. QA Benchmark Suite
git add tests/e2e-benchmark-validation.test.ts
git commit -m "test(qa): add end-to-end integration and 12-stage mandatory benchmark validation suite"

# 11. DevOps & Final Documentation
git add docker-compose.prod.yml backend/Dockerfile frontend/Dockerfile frontend/nginx.conf .env.production.example scripts/ docs/ README.md backend/.env.example
git commit -m "docs(devops): add production Dockerfiles, EC2 hosting guide, technical design note, demo plan, and comprehensive README"

Write-Host "==================================================================" -ForegroundColor Green
Write-Host "Git commits created successfully! Ready to push to remote:" -ForegroundColor Green
Write-Host "  git remote add origin https://github.com/<your-username>/order-to-audit-erp.git" -ForegroundColor White
Write-Host "  git branch -M main" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Green
