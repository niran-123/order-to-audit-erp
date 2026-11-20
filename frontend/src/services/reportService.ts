/**
 * BI & Audit Reporting API Client
 * Order-to-Audit Manufacturing ERP
 */

import api from './api';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  productId?: string;
  supplierId?: string;
  transactionType?: string;
  status?: string;
  search?: string;
}

export interface OwnerDashboardData {
  todayOrdersCount: number;
  todaySalesAmount: number;
  totalSalesRevenue: number;
  totalProductionGoodPackets: number;
  availableFinishedGoodsPackets: number;
  rawMaterialValuation: number;
  packagingMaterialValuation: number;
  lowStockAlertsCount: number;
  productionVarianceAlertsCount: number;
  benchmarkCostPerPacket: number;
  totalOutstandingReceivables: number;
  monthlySalesTrends: {
    month: string;
    salesAmount: number;
    ordersCount: number;
  }[];
  lowStockItems: {
    code: string;
    name: string;
    category: string;
    stock: number;
    reorderLevel: number;
    unit: string;
  }[];
  activeVarianceAlerts: {
    runNumber: string;
    productName: string;
    metric: string;
    variancePct: number;
    description: string;
  }[];
}

export interface AdminDashboardData {
  orders: {
    pendingCount: number;
    approvedCount: number;
    invoicedCount: number;
    cancelledCount: number;
    totalCount: number;
  };
  invoicesGeneratedCount: number;
  totalInvoicedValue: number;
  dispatchStatusCounts: {
    pending: number;
    partiallyDispatched: number;
    dispatched: number;
  };
  customerCollectionsTotal: number;
  stockAvailability: {
    id: string;
    code: string;
    name: string;
    category: string;
    currentStock: number;
    allocatedStock: number;
    availableStock: number;
    unit: string;
    reorderLevel: number;
    status: string;
  }[];
}

export interface ProductionDashboardData {
  totalProductionRuns: number;
  completedRunsCount: number;
  inProgressRunsCount: number;
  plannedVsActual: {
    plannedOutput: number;
    actualGoodOutput: number;
    damagedPackets: number;
    overallYieldPct: number;
  };
  rawMaterialConsumption: {
    materialName: string;
    plannedQty: number;
    actualQty: number;
    unit: string;
    variancePct: number;
  }[];
  productionWastage: {
    totalDamagedPackets: number;
    totalScrapPouches: number;
    totalWastageValue: number;
  };
  yieldVariances: {
    runNumber: string;
    productName: string;
    yieldPercentage: number;
    yieldVariancePercentage: number;
    hasAlert: boolean;
  }[];
  finishedGoodsStock: {
    productName: string;
    availablePackets: number;
    currentStock: number;
    allocatedStock: number;
  }[];
}

export const ReportService = {
  // Dashboards
  async getOwnerDashboard(): Promise<OwnerDashboardData> {
    const res = await api.get('/reports/dashboards/owner');
    return res.data.data;
  },

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const res = await api.get('/reports/dashboards/admin');
    return res.data.data;
  },

  async getProductionDashboard(): Promise<ProductionDashboardData> {
    const res = await api.get('/reports/dashboards/production');
    return res.data.data;
  },

  // Dynamic Report Fetcher (JSON)
  async getReport(slug: string, filters: ReportFilterParams = {}): Promise<any> {
    const res = await api.get(`/reports/${slug}`, { params: filters });
    return res.data.data;
  },

  // Audit Trail
  async getAuditTrail(filters: ReportFilterParams = {}): Promise<any> {
    const res = await api.get('/reports/audit-trail', { params: filters });
    return res.data.data;
  },

  // Download CSV
  async downloadReportCSV(slug: string, filters: ReportFilterParams = {}): Promise<void> {
    const token = localStorage.getItem('erp_token');
    const query = new URLSearchParams({
      ...filters,
      export: 'csv',
    } as Record<string, string>).toString();

    const response = await fetch(`/api/v1/reports/${slug}?${query}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
