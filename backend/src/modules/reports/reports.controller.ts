/**
 * BI & Reporting Controller
 * Order-to-Audit Manufacturing ERP
 */

import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { ReportFilterParams } from './reports.types';
import { BadRequestError } from '../../utils/appError';

export class ReportsController {
  private static parseFilters(req: Request): ReportFilterParams {
    return {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      customerId: req.query.customerId as string | undefined,
      productId: req.query.productId as string | undefined,
      supplierId: req.query.supplierId as string | undefined,
      transactionType: req.query.transactionType as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
  }

  private static sendReportOrCsv(
    req: Request,
    res: Response,
    reportSlug: string,
    jsonDataFetcher: () => any
  ) {
    const isCsv = req.query.export === 'csv' || req.query.format === 'csv';

    if (isCsv) {
      const filters = ReportsController.parseFilters(req);
      const csv = ReportsService.exportReportToCSV(reportSlug, filters);
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${reportSlug}_${timestamp}.csv"`
      );
      return res.status(200).send(csv);
    }

    const data = jsonDataFetcher();
    return res.status(200).json({
      status: 'success',
      data,
    });
  }

  // 1. Sales Register
  static getSalesRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'sales-register', () =>
        ReportsService.getSalesRegister(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 2. Customer-wise Sales
  static getCustomerSales(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'customer-sales', () =>
        ReportsService.getCustomerSalesReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 3. Product-wise Sales
  static getProductSales(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'product-sales', () =>
        ReportsService.getProductSalesReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 4. GST Outward Supplies
  static getGSTOutwardSupplies(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'gst-outward', () =>
        ReportsService.getGSTOutwardSupplies(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 5. Purchase Register
  static getPurchaseRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'purchase-register', () =>
        ReportsService.getPurchaseRegister(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 6. Raw Material Stock
  static getRawMaterialStock(req: Request, res: Response, next: NextFunction) {
    try {
      ReportsController.sendReportOrCsv(req, res, 'raw-material-stock', () =>
        ReportsService.getMaterialStockSummary('RAW_MATERIAL')
      );
    } catch (err) {
      next(err);
    }
  }

  // 7. Packaging Material Stock
  static getPackagingMaterialStock(req: Request, res: Response, next: NextFunction) {
    try {
      ReportsController.sendReportOrCsv(req, res, 'packaging-stock', () =>
        ReportsService.getMaterialStockSummary('PACKAGING_MATERIAL')
      );
    } catch (err) {
      next(err);
    }
  }

  // 8. Finished Goods Stock
  static getFinishedGoodsStock(req: Request, res: Response, next: NextFunction) {
    try {
      ReportsController.sendReportOrCsv(req, res, 'finished-goods-stock', () =>
        ReportsService.getFinishedGoodsStockSummary()
      );
    } catch (err) {
      next(err);
    }
  }

  // 9. Complete Stock Ledger
  static getStockLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'stock-ledger', () =>
        ReportsService.getCompleteStockLedger(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 10. Production Report
  static getProductionReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'production-report', () =>
        ReportsService.getProductionReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 11. Planned vs Actual Consumption
  static getConsumptionVariance(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'consumption-variance', () =>
        ReportsService.getPlannedVsActualConsumption(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 12. Production Yield
  static getProductionYield(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'yield-report', () =>
        ReportsService.getProductionYieldReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 13. Wastage Report
  static getWastageReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'wastage-report', () =>
        ReportsService.getWastageReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 14. Cost Per Packet Report
  static getCostPerPacket(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'cost-per-packet', () =>
        ReportsService.getCostPerPacketReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 15. Payments and Collections
  static getPaymentsCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'payments-collections', () =>
        ReportsService.getPaymentsCollectionsReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 16. Customer Outstanding
  static getCustomerOutstanding(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'customer-outstanding', () =>
        ReportsService.getCustomerOutstandingReport(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // 17. Receivables Ageing
  static getReceivablesAgeing(req: Request, res: Response, next: NextFunction) {
    try {
      ReportsController.sendReportOrCsv(req, res, 'receivables-ageing', () =>
        ReportsService.getReceivablesAgeingReport()
      );
    } catch (err) {
      next(err);
    }
  }

  // Audit Trail
  static getAuditTrail(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportsController.parseFilters(req);
      ReportsController.sendReportOrCsv(req, res, 'audit-trail', () =>
        ReportsService.getAuditTrail(filters)
      );
    } catch (err) {
      next(err);
    }
  }

  // Generic Dynamic Report Dispatcher: /api/v1/reports/:slug
  static getDynamicReport(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      const filters = ReportsController.parseFilters(req);

      switch (slug) {
        case 'sales-register':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getSalesRegister(filters)
          );
        case 'customer-sales':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getCustomerSalesReport(filters)
          );
        case 'product-sales':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getProductSalesReport(filters)
          );
        case 'gst-outward':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getGSTOutwardSupplies(filters)
          );
        case 'purchase-register':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getPurchaseRegister(filters)
          );
        case 'raw-material-stock':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getMaterialStockSummary('RAW_MATERIAL')
          );
        case 'packaging-stock':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getMaterialStockSummary('PACKAGING_MATERIAL')
          );
        case 'finished-goods-stock':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getFinishedGoodsStockSummary()
          );
        case 'stock-ledger':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getCompleteStockLedger(filters)
          );
        case 'production-report':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getProductionReport(filters)
          );
        case 'consumption-variance':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getPlannedVsActualConsumption(filters)
          );
        case 'yield-report':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getProductionYieldReport(filters)
          );
        case 'wastage-report':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getWastageReport(filters)
          );
        case 'cost-per-packet':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getCostPerPacketReport(filters)
          );
        case 'payments-collections':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getPaymentsCollectionsReport(filters)
          );
        case 'customer-outstanding':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getCustomerOutstandingReport(filters)
          );
        case 'receivables-ageing':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getReceivablesAgeingReport()
          );
        case 'audit-trail':
          return ReportsController.sendReportOrCsv(req, res, slug, () =>
            ReportsService.getAuditTrail(filters)
          );
        default:
          throw new BadRequestError(`Unknown report requested: ${slug}`);
      }
    } catch (err) {
      next(err);
    }
  }

  // Dashboard Aggregators
  static getOwnerDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ReportsService.getOwnerDashboardData();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ReportsService.getAdminDashboardData();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static getProductionDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ReportsService.getProductionDashboardData();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
