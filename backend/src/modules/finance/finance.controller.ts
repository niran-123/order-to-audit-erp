import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { sendSuccess } from '../../utils/apiResponse';

export class FinanceController {
  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const recorder = {
        userId: req.user?.userId || 'accountant',
        email: req.user?.email || 'accountant@enterprise.com',
      };

      const payment = await FinanceService.recordPayment(req.body, recorder);
      return sendSuccess(
        res,
        payment,
        `Payment ${payment.paymentNumber} of ₹${payment.amount.toLocaleString('en-IN')} recorded successfully`,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, search } = req.query;
      const payments = FinanceService.listPayments({
        customerId: customerId as string,
        search: search as string,
      });
      return sendSuccess(res, payments, 'Payment transactions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = FinanceService.getPaymentById(req.params.id);
      return sendSuccess(res, payment, 'Payment details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAccountsReceivable(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = FinanceService.getAccountsReceivable();
      return sendSuccess(res, summary, 'Accounts receivable and ageing ledger retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProductionCosting(req: Request, res: Response, next: NextFunction) {
    try {
      const { runId } = req.query;
      const costing = FinanceService.calculateProductionCosting(runId as string);
      return sendSuccess(res, costing, 'Production costing breakdown computed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProductProfitability(_req: Request, res: Response, next: NextFunction) {
    try {
      const profitability = FinanceService.calculateProductProfitability();
      return sendSuccess(res, profitability, 'Product profitability and gross margins retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
