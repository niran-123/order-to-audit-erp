import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HealthCheckPage } from './pages/HealthCheckPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Role Dashboards
import { OwnerDashboard } from './pages/dashboards/OwnerDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { SalesmanDashboard } from './pages/dashboards/SalesmanDashboard';
import { ProductionDashboard } from './pages/dashboards/ProductionDashboard';
import { AccountantDashboard } from './pages/dashboards/AccountantDashboard';
import { AuditorDashboard } from './pages/dashboards/AuditorDashboard';

// Master Data Management Pages
import { MasterDataHubPage } from './pages/master-data/MasterDataHubPage';
import { CustomersPage } from './pages/master-data/CustomersPage';
import { SuppliersPage } from './pages/master-data/SuppliersPage';
import { ProductsPage } from './pages/master-data/ProductsPage';
import { ProductCategoriesPage } from './pages/master-data/ProductCategoriesPage';
import { RawMaterialsPage } from './pages/master-data/RawMaterialsPage';
import { PackagingMaterialsPage } from './pages/master-data/PackagingMaterialsPage';
import { UnitsAndConversionsPage } from './pages/master-data/UnitsAndConversionsPage';
import { SellingPricesPage } from './pages/master-data/SellingPricesPage';
import { BOMMasterPage } from './pages/master-data/BOMMasterPage';

// Inventory & Purchasing Management Pages
import { InventoryDashboardPage } from './pages/inventory/InventoryDashboardPage';
import { StockLedgerPage } from './pages/inventory/StockLedgerPage';
import { PurchasesPage } from './pages/inventory/PurchasesPage';
import { StockReconciliationPage } from './pages/inventory/StockReconciliationPage';

// Production & BOM Management Pages
import { ProductionDashboardPage } from './pages/production/ProductionDashboardPage';
import { BOMManagementPage } from './pages/production/BOMManagementPage';

// Sales, Invoices & Dispatch Workflow Pages
import { AdminOrderDashboard } from './pages/sales/AdminOrderDashboard';
import { SalesmanMobileApp } from './pages/sales/SalesmanMobileApp';
import { InvoiceViewPage } from './pages/invoices/InvoiceViewPage';

// Financial & Cost Accounting Pages
import { PaymentManagementPage } from './pages/finance/PaymentManagementPage';
import { AccountsReceivablePage } from './pages/finance/AccountsReceivablePage';
import { ProductionCostingPage } from './pages/finance/ProductionCostingPage';

// BI & Audit Reporting Hub
import { ReportsHubPage } from './pages/reports/ReportsHubPage';

/**
 * Root Router index that redirects authenticated users to their specific role dashboard
 */
const RoleDashboardRedirect: React.FC = () => {
  const { roles, isLoading } = useAuth();

  if (isLoading) return null;

  if (roles.includes('OWNER')) return <Navigate to="/dashboard/owner" replace />;
  if (roles.includes('ADMIN')) return <Navigate to="/dashboard/admin" replace />;
  if (roles.includes('SALESMAN')) return <Navigate to="/dashboard/salesman" replace />;
  if (roles.includes('PRODUCTION_SUPERVISOR')) return <Navigate to="/dashboard/production" replace />;
  if (roles.includes('ACCOUNTANT')) return <Navigate to="/dashboard/accountant" replace />;
  if (roles.includes('AUDITOR')) return <Navigate to="/dashboard/auditor" replace />;

  return <Navigate to="/dashboard/owner" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Gateway */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Workspace */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RoleDashboardRedirect />} />
              <Route path="/health" element={<HealthCheckPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Commercial Sales, GST Billing & Dispatch */}
              <Route path="/sales" element={<AdminOrderDashboard />} />
              <Route path="/sales/mobile" element={<SalesmanMobileApp />} />
              <Route path="/invoices" element={<InvoiceViewPage />} />

              {/* Finance, Payments & Cost Accounting */}
              <Route path="/payments" element={<PaymentManagementPage />} />
              <Route path="/finance/receivables" element={<AccountsReceivablePage />} />
              <Route path="/finance/costing" element={<ProductionCostingPage />} />

              {/* BI & Audit Reporting Hub */}
              <Route path="/reports" element={<ReportsHubPage />} />

              {/* Production Floor & BOM Management */}
              <Route path="/production" element={<ProductionDashboardPage />} />
              <Route path="/production/bom" element={<BOMManagementPage />} />

              {/* Inventory & Purchasing Management */}
              <Route path="/inventory" element={<InventoryDashboardPage />} />
              <Route path="/inventory/ledger" element={<StockLedgerPage />} />
              <Route path="/inventory/purchases" element={<PurchasesPage />} />
              <Route path="/inventory/reconcile" element={<StockReconciliationPage />} />

              {/* Master Data Management Modules */}
              <Route path="/master-data" element={<MasterDataHubPage />} />
              <Route path="/master-data/customers" element={<CustomersPage />} />
              <Route path="/master-data/suppliers" element={<SuppliersPage />} />
              <Route path="/master-data/products" element={<ProductsPage />} />
              <Route path="/master-data/categories" element={<ProductCategoriesPage />} />
              <Route path="/master-data/raw-materials" element={<RawMaterialsPage />} />
              <Route path="/master-data/packaging-materials" element={<PackagingMaterialsPage />} />
              <Route path="/master-data/units" element={<UnitsAndConversionsPage />} />
              <Route path="/master-data/pricing" element={<SellingPricesPage />} />
              <Route path="/master-data/bom" element={<BOMMasterPage />} />

              {/* Role-Dedicated Dashboards */}
              <Route element={<RoleRoute allowedRoles={['OWNER']} />}>
                <Route path="/dashboard/owner" element={<OwnerDashboard />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['ADMIN', 'OWNER']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['SALESMAN', 'OWNER', 'ADMIN']} />}>
                <Route path="/dashboard/salesman" element={<SalesmanDashboard />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['PRODUCTION_SUPERVISOR', 'OWNER', 'ADMIN']} />}>
                <Route path="/dashboard/production" element={<ProductionDashboard />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['ACCOUNTANT', 'OWNER', 'ADMIN']} />}>
                <Route path="/dashboard/accountant" element={<AccountantDashboard />} />
              </Route>

              <Route element={<RoleRoute allowedRoles={['AUDITOR', 'OWNER', 'ADMIN']} />}>
                <Route path="/dashboard/auditor" element={<AuditorDashboard />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
