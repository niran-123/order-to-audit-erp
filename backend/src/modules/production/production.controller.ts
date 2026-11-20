/**
 * Production & BOM Controller
 * Order-to-Audit Manufacturing ERP
 */

import { Request, Response, NextFunction } from 'express';
import { ProductionService } from './production.service';

export class ProductionController {
  // ==========================================
  // BOM ENDPOINTS
  // ==========================================

  static async listBOMs(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.query.productId as string | undefined;
      const boms = ProductionService.listBOMs(productId);
      res.json({ success: true, data: boms });
    } catch (err) {
      next(err);
    }
  }

  static async getBOMById(req: Request, res: Response, next: NextFunction) {
    try {
      const bom = ProductionService.getBOMById(req.params.id);
      res.json({ success: true, data: bom });
    } catch (err) {
      next(err);
    }
  }

  static async createBOM(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || 'usr-admin-01';
      const bom = await ProductionService.createBOM(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Bill of Materials created successfully',
        data: bom,
      });
    } catch (err) {
      next(err);
    }
  }

  static async calculateRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const bomId = req.params.id;
      const plannedOutput = Number(req.query.plannedOutput || 200);
      const requirements = ProductionService.calculateMaterialRequirements(bomId, plannedOutput);
      res.json({ success: true, data: requirements });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PRODUCTION RUN ENDPOINTS
  // ==========================================

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = ProductionService.getProductionDashboard();
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  static async listProductionRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as any,
        search: req.query.search as string | undefined,
      };
      const runs = ProductionService.listProductionRuns(filters);
      res.json({ success: true, data: runs });
    } catch (err) {
      next(err);
    }
  }

  static async getProductionRunById(req: Request, res: Response, next: NextFunction) {
    try {
      const run = ProductionService.getProductionRunById(req.params.id);
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  static async createProductionRun(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || 'usr-supervisor-01';
      const userEmail = (req as any).user?.email || 'Production Supervisor';
      const run = await ProductionService.createProductionRun(
        {
          ...req.body,
          supervisorId: req.body.supervisorId || userId,
          supervisorName: req.body.supervisorName || userEmail,
        },
        userId
      );
      res.status(201).json({
        success: true,
        message: 'Production Run scheduled successfully',
        data: run,
      });
    } catch (err) {
      next(err);
    }
  }

  static async completeAndPostRun(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || 'usr-supervisor-01';
      const userEmail = (req as any).user?.email || 'Production Supervisor';
      const tolerance = req.query.tolerance ? Number(req.query.tolerance) : 3.0;

      const run = await ProductionService.completeAndPostProductionRun(
        req.params.id,
        {
          ...req.body,
          supervisorId: userId,
          supervisorName: userEmail,
        },
        tolerance
      );

      res.json({
        success: true,
        message: 'Production Run completed and posted. Inventory and finished goods updated.',
        data: run,
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelProductionRun(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || 'usr-admin-01';
      const run = await ProductionService.cancelProductionRun(req.params.id, userId);
      res.json({
        success: true,
        message: 'Production Run cancelled successfully',
        data: run,
      });
    } catch (err) {
      next(err);
    }
  }
}
