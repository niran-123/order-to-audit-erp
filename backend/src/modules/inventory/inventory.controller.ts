/**
 * Inventory & Purchases Controller
 * Order-to-Audit Manufacturing ERP
 */

import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { PurchasesService } from './purchases.service';
import { InventoryCategory } from './inventory.types';

export class InventoryController {
  // ==========================================
  // INVENTORY ENDPOINTS
  // ==========================================

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = InventoryService.getInventoryDashboard();
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  static async getStockBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as InventoryCategory | undefined;
      const search = req.query.search as string | undefined;
      const balances = InventoryService.getStockBalances(category, search);
      res.json({ success: true, data: balances });
    } catch (err) {
      next(err);
    }
  }

  static async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = InventoryService.getItemById(req.params.id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async getStockLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        itemId: req.query.itemId as string | undefined,
        category: req.query.category as InventoryCategory | undefined,
        movementType: req.query.movementType as any,
        sourceDocumentType: req.query.sourceDocumentType as any,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };
      const result = InventoryService.getStockLedger(filters);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async reconcileStock(req: Request, res: Response, next: NextFunction) {
    try {
      const performedBy = (req as any).user?.userId || 'usr-supervisor-01';
      const movement = await InventoryService.reconcileStock({
        itemId: req.body.itemId,
        physicalCount: req.body.physicalCount,
        reason: req.body.reason,
        performedBy,
      });
      res.status(201).json({
        success: true,
        message: 'Stock physical reconciliation recorded successfully',
        data: movement,
      });
    } catch (err) {
      next(err);
    }
  }

  static async recordManualMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const performedBy = (req as any).user?.userId || 'usr-supervisor-01';
      const movement = await InventoryService.recordStockMovement({
        ...req.body,
        performedBy,
      });
      res.status(201).json({
        success: true,
        message: 'Stock movement recorded successfully',
        data: movement,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PURCHASES ENDPOINTS
  // ==========================================

  static async listPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as any,
        supplierId: req.query.supplierId as string | undefined,
        search: req.query.search as string | undefined,
      };
      const purchases = PurchasesService.listPurchases(filters);
      res.json({ success: true, data: purchases });
    } catch (err) {
      next(err);
    }
  }

  static async getPurchaseById(req: Request, res: Response, next: NextFunction) {
    try {
      const po = PurchasesService.getPurchaseById(req.params.id);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  }

  static async createPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const createdBy = (req as any).user?.userId || 'usr-admin-01';
      const createdByName = (req as any).user?.email || 'Admin / Procurement';
      const po = await PurchasesService.createPurchase({
        ...req.body,
        createdBy,
        createdByName,
      });
      res.status(201).json({
        success: true,
        message: 'Purchase Order created successfully',
        data: po,
      });
    } catch (err) {
      next(err);
    }
  }

  static async confirmPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const confirmedBy = (req as any).user?.userId || 'usr-supervisor-01';
      const confirmedByName = (req as any).user?.email || 'Supervisor';
      const po = await PurchasesService.confirmPurchase({
        purchaseId: req.params.id,
        supplierInvoiceNumber: req.body.supplierInvoiceNumber,
        confirmedBy,
        confirmedByName,
      });
      res.json({
        success: true,
        message: 'Purchase Order confirmed and GRN Goods Receipt generated. Inventory updated.',
        data: po,
      });
    } catch (err) {
      next(err);
    }
  }
}
