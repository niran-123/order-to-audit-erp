import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Layers,
  ShoppingCart,
  Factory,
  Package,
  FileText,
  CreditCard,
  ShieldAlert,
  Users,
  Database,
  Truck,
  Wheat,
  Box,
  Scale,
  Tag,
  ChevronDown,
  ChevronRight,
  Sliders,
  Smartphone,
  BarChart3,
} from 'lucide-react';
import { cn } from '../utils/cn';

const operationalNavItems = [
  { label: 'Executive Cockpit', to: '/', icon: LayoutDashboard },
  { label: 'BI & Audit Reports', to: '/reports', icon: BarChart3 },
  { label: 'System Health', to: '/health', icon: Activity },
  { label: 'Sales & Orders', to: '/sales', icon: ShoppingCart },
  { label: 'Salesman Mobile App', to: '/sales/mobile', icon: Smartphone },
  { label: 'GST Invoicing', to: '/invoices', icon: FileText },
  { label: 'Customer Payments', to: '/payments', icon: CreditCard },
  { label: 'AR Ageing Analysis', to: '/finance/receivables', icon: Scale },
  { label: 'Audit Trail', to: '/audit', icon: ShieldAlert },
  { label: 'User Directory', to: '/users', icon: Users },
];

const productionNavItems = [
  { label: 'Shop Floor & Work Orders', to: '/production', icon: Factory },
  { label: 'BOM Master Formulations', to: '/production/bom', icon: Layers },
  { label: 'Production Costing & Margins', to: '/finance/costing', icon: Scale },
];

const inventoryNavItems = [
  { label: 'Inventory Dashboard', to: '/inventory', icon: Package },
  { label: 'Purchases & GRN', to: '/inventory/purchases', icon: Truck },
  { label: 'Stock Ledger', to: '/inventory/ledger', icon: FileText },
  { label: 'Physical Reconciliation', to: '/inventory/reconcile', icon: Sliders },
];

const masterDataItems = [
  { label: 'Master Data Hub', to: '/master-data', icon: Database },
  { label: 'Customers', to: '/master-data/customers', icon: Users },
  { label: 'Suppliers', to: '/master-data/suppliers', icon: Truck },
  { label: 'Products (Murukku 200g)', to: '/master-data/products', icon: Package },
  { label: 'Product Categories', to: '/master-data/categories', icon: Layers },
  { label: 'Raw Materials', to: '/master-data/raw-materials', icon: Wheat },
  { label: 'Packaging Materials', to: '/master-data/packaging-materials', icon: Box },
  { label: 'Units & Conversions', to: '/master-data/units', icon: Scale },
  { label: 'Selling Prices', to: '/master-data/pricing', icon: Tag },
  { label: 'BOM Master Formula', to: '/master-data/bom', icon: Layers },
];

export const Sidebar: React.FC = () => {
  const [isProductionOpen, setIsProductionOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(true);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 z-20">
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-slate-800">
        <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
          O
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight leading-none">
            Order-to-Audit
          </h1>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">Manufacturing ERP</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Operational Section */}
        <div>
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            Operations
          </div>
          <div className="space-y-0.5">
            {operationalNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Production & Manufacturing Section */}
        <div>
          <button
            onClick={() => setIsProductionOpen(!isProductionOpen)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5 text-brand-400">
              <Factory className="w-3.5 h-3.5" />
              <span>Production & BOM</span>
            </div>
            {isProductionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isProductionOpen && (
            <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-slate-800 ml-3">
              {productionNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                    )
                  }
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Inventory & Purchasing Section */}
        <div>
          <button
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Package className="w-3.5 h-3.5" />
              <span>Inventory & Procurement</span>
            </div>
            {isInventoryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isInventoryOpen && (
            <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-slate-800 ml-3">
              {inventoryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                    )
                  }
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Master Data Section */}
        <div>
          <button
            onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5 text-brand-400">
              <Database className="w-3.5 h-3.5" />
              <span>Master Data Registry</span>
            </div>
            {isMasterDataOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isMasterDataOpen && (
            <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-slate-800 ml-3">
              {masterDataItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-600/30 text-brand-300 font-semibold border border-brand-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                    )
                  }
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
        <span>v1.0.0-rc1</span>
        <span>Murukku 200g ERP</span>
      </div>
    </aside>
  );
};
