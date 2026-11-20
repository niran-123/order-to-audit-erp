import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Truck,
  Package,
  Layers,
  Wheat,
  Box,
  Scale,
  Tag,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const MODULE_CARDS = [
  {
    title: 'Customer Management',
    description: 'Retailers, distributors, GSTIN verification, credit limits, and delivery locations.',
    to: '/master-data/customers',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    stats: 'Distributors & Retailers',
    exportModule: 'customers',
  },
  {
    title: 'Supplier Management',
    description: 'Grain millers, edible oil refineries, packaging converters, and payment terms.',
    to: '/master-data/suppliers',
    icon: Truck,
    color: 'from-emerald-500 to-teal-600',
    stats: 'Approved Vendors',
    exportModule: 'suppliers',
  },
  {
    title: 'Finished Products',
    description: 'Catalog including Murukku 200g, HSN codes, GST 12%, standard trade rates.',
    to: '/master-data/products',
    icon: Package,
    color: 'from-amber-500 to-orange-600',
    stats: 'Murukku 200g Featured',
    exportModule: 'products',
  },
  {
    title: 'Product Categories',
    description: 'Hierarchical taxonomy: Savory Snacks, Traditional Sweets, and Flours.',
    to: '/master-data/categories',
    icon: Layers,
    color: 'from-purple-500 to-pink-600',
    stats: 'Taxonomy Hierarchy',
  },
  {
    title: 'Raw Material Catalog',
    description: 'Rice flour, urad dal flour, besan, refined frying oil, salt, and spices.',
    to: '/master-data/raw-materials',
    icon: Wheat,
    color: 'from-yellow-500 to-amber-600',
    stats: '8 Benchmark Ingredients',
    exportModule: 'raw-materials',
  },
  {
    title: 'Packaging Materials',
    description: '3-Ply nitrogen barrier pouches, 5-ply cartons, BOPP tapes, oxygen scavengers.',
    to: '/master-data/packaging-materials',
    icon: Box,
    color: 'from-cyan-500 to-blue-600',
    stats: 'Primary & Secondary Pack',
    exportModule: 'packaging-materials',
  },
  {
    title: 'Units & Conversions',
    description: 'Weight, volume, and count units (KG, G, LTR, PKT, CTN) and conversion math.',
    to: '/master-data/units',
    icon: Scale,
    color: 'from-violet-500 to-purple-600',
    stats: '1 KG = 1000 G | 1 CTN = 50 PKT',
  },
  {
    title: 'Selling Price Lists',
    description: 'Tiered wholesale pricing: Base trade, Retailer (50+), Distributor (500+).',
    to: '/master-data/pricing',
    icon: Tag,
    color: 'from-rose-500 to-red-600',
    stats: 'Multi-Tier Pricing',
  },
  {
    title: 'BOM Master Engineering',
    description: 'Murukku 200g batch formula (100 kg dough = 500 pkts), scrap rates & unit costing.',
    to: '/master-data/bom',
    icon: FileSpreadsheet,
    color: 'from-indigo-600 to-blue-700',
    stats: '10-Line Recipe Formula',
  },
];

export const MasterDataHubPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Core Master Data
              </span>
              <span className="text-xs text-slate-400">• Murukku 200 g Benchmark Loaded</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Master Registry</h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Maintain foundational business entities, production bills-of-material, tiered pricing structures,
              units of measurement, and multi-tier partner accounts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/master-data/bom"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inspect Murukku BOM</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of 9 Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {card.stats}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={card.to}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <span>Manage Records</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
