import { Request, Response, NextFunction } from 'express';
import { SalesService } from './sales.service';
import { sendSuccess } from '../../utils/apiResponse';
import { BadRequestError } from '../../utils/appError';

export class SalesController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const salesman = {
        userId: req.user?.userId || 'unknown-sales',
        email: req.user?.email || 'sales@enterprise.com',
        name: req.user?.email?.split('@')[0],
      };

      const order = await SalesService.createOrder(req.body, salesman);
      return sendSuccess(res, order, 'Sales order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, customerId, search } = req.query;
      const currentUser = req.user
        ? {
            userId: req.user.userId,
            email: req.user.email,
            roles: req.user.roles,
          }
        : undefined;

      const orders = SalesService.listOrders(
        {
          status: status as any,
          customerId: customerId as string,
          search: search as string,
        },
        currentUser
      );

      return sendSuccess(res, orders, 'Sales orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user
        ? {
            userId: req.user.userId,
            email: req.user.email,
            roles: req.user.roles,
          }
        : undefined;

      const order = SalesService.getOrderById(req.params.id, currentUser);
      return sendSuccess(res, order, 'Sales order retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async approveOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = {
        userId: req.user?.userId || 'admin',
        email: req.user?.email || 'admin@enterprise.com',
      };

      const order = await SalesService.approveOrder(req.params.id, adminUser);
      return sendSuccess(res, order, `Sales order ${order.soNumber} approved successfully`);
    } catch (error) {
      next(error);
    }
  }

  static async rejectOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const adminUser = {
        userId: req.user?.userId || 'admin',
        email: req.user?.email || 'admin@enterprise.com',
      };

      const order = await SalesService.rejectOrder(req.params.id, reason, adminUser);
      return sendSuccess(res, order, `Sales order ${order.soNumber} rejected`);
    } catch (error) {
      next(error);
    }
  }

  static async checkStockAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const requestedQty = Number(req.query.requestedQty || req.body.requestedQty || 1);
      const result = SalesService.checkStockAvailability(productId, requestedQty);
      return sendSuccess(res, result, 'Stock availability checked');
    } catch (error) {
      next(error);
    }
  }

  static async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = {
        userId: req.user?.userId || 'accountant',
        email: req.user?.email || 'accountant@enterprise.com',
      };

      const invoice = await SalesService.generateInvoice(req.params.id, currentUser);
      return sendSuccess(res, invoice, `GST Tax Invoice ${invoice.invoiceNumber} generated successfully`, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const invoices = SalesService.listInvoices();
      return sendSuccess(res, invoices, 'Invoices retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = SalesService.getInvoiceById(req.params.id);
      return sendSuccess(res, invoice, 'Invoice retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      SalesService.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async createDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = {
        userId: req.user?.userId || 'supervisor',
        email: req.user?.email || 'supervisor@enterprise.com',
      };

      const dispatch = await SalesService.createDispatch(req.params.id, req.body, currentUser);
      return sendSuccess(
        res,
        dispatch,
        `Dispatch created successfully with Delivery Challan ${dispatch.deliveryChallanNo}`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async listDispatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.query;
      const dispatches = SalesService.listDispatches(orderId as string);
      return sendSuccess(res, dispatches, 'Dispatches retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerWiseSales(req: Request, res: Response, next: NextFunction) {
    try {
      const salesmanId = req.user?.roles.includes('SALESMAN') && !req.user?.roles.includes('ADMIN') && !req.user?.roles.includes('OWNER')
        ? req.user.userId
        : undefined;

      const stats = SalesService.getCustomerWiseSales(salesmanId);
      return sendSuccess(res, stats, 'Customer-wise sales report retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
