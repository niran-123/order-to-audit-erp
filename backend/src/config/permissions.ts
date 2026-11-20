import { SystemRole } from '@prisma/client';

export const Permissions = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE_STATUS: 'user:update_status',

  // Sales Orders
  ORDER_CREATE: 'order:create',
  ORDER_READ_ALL: 'order:read:all',
  ORDER_READ_OWN: 'order:read:own',
  ORDER_APPROVE: 'order:approve',
  ORDER_MODIFY: 'order:modify',

  // Billing & GST Invoices
  INVOICE_CREATE: 'invoice:create',
  INVOICE_READ: 'invoice:read',
  INVOICE_POST: 'invoice:post',

  // Production & Manufacturing
  PRODUCTION_EXECUTE: 'production:execute',
  PRODUCTION_BOM_MANAGE: 'production:bom_manage',
  PRODUCTION_READ: 'production:read',

  // Inventory & Stock
  STOCK_MOVE: 'stock:move',
  STOCK_READ: 'stock:read',

  // Finance & Payments
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_READ: 'payment:read',

  // Audit & Compliance
  AUDIT_READ: 'audit:read',
  AUDIT_LOCK_PERIOD: 'audit:lock_period',
  TRANSACTION_MODIFY: 'transaction:modify',
} as const;

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];

/**
 * Role-Based Permission Matrix
 * Explicitly defines what each of the 6 core personas is authorized to perform.
 */
export const ROLE_PERMISSION_MATRIX: Record<SystemRole, PermissionCode[]> = {
  OWNER: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE_STATUS,
    Permissions.ORDER_CREATE,
    Permissions.ORDER_READ_ALL,
    Permissions.ORDER_APPROVE,
    Permissions.ORDER_MODIFY,
    Permissions.INVOICE_CREATE,
    Permissions.INVOICE_READ,
    Permissions.INVOICE_POST,
    Permissions.PRODUCTION_EXECUTE,
    Permissions.PRODUCTION_BOM_MANAGE,
    Permissions.PRODUCTION_READ,
    Permissions.STOCK_MOVE,
    Permissions.STOCK_READ,
    Permissions.PAYMENT_CREATE,
    Permissions.PAYMENT_READ,
    Permissions.AUDIT_READ,
    Permissions.AUDIT_LOCK_PERIOD,
    Permissions.TRANSACTION_MODIFY,
  ],

  ADMIN: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE_STATUS,
    Permissions.ORDER_READ_ALL,
    Permissions.ORDER_APPROVE,
    Permissions.INVOICE_READ,
    Permissions.PRODUCTION_READ,
    Permissions.STOCK_READ,
    Permissions.PAYMENT_READ,
    Permissions.AUDIT_READ,
    Permissions.TRANSACTION_MODIFY,
  ],

  SALESMAN: [
    Permissions.ORDER_CREATE,
    Permissions.ORDER_READ_OWN, // Strictly restricted to own orders
    Permissions.PRODUCTION_READ,
    Permissions.STOCK_READ,
    Permissions.TRANSACTION_MODIFY,
  ],

  PRODUCTION_SUPERVISOR: [
    Permissions.PRODUCTION_EXECUTE,
    Permissions.PRODUCTION_BOM_MANAGE,
    Permissions.PRODUCTION_READ,
    Permissions.STOCK_MOVE,
    Permissions.STOCK_READ,
    Permissions.ORDER_READ_ALL,
    Permissions.TRANSACTION_MODIFY,
    // Note: INVOICE_CREATE is explicitly omitted
  ],

  ACCOUNTANT: [
    Permissions.INVOICE_CREATE,
    Permissions.INVOICE_READ,
    Permissions.INVOICE_POST,
    Permissions.PAYMENT_CREATE,
    Permissions.PAYMENT_READ,
    Permissions.ORDER_READ_ALL,
    Permissions.STOCK_READ,
    Permissions.TRANSACTION_MODIFY,
  ],

  AUDITOR: [
    Permissions.AUDIT_READ,
    Permissions.AUDIT_LOCK_PERIOD,
    Permissions.ORDER_READ_ALL,
    Permissions.INVOICE_READ,
    Permissions.PRODUCTION_READ,
    Permissions.STOCK_READ,
    Permissions.PAYMENT_READ,
    Permissions.USER_READ,
    // Note: TRANSACTION_MODIFY is explicitly omitted - Auditors cannot mutate transactions
  ],
};

/**
 * Returns the default dashboard redirect route based on user role.
 */
export function getRoleDashboardRedirect(role: SystemRole): string {
  switch (role) {
    case 'OWNER':
      return '/dashboard/owner';
    case 'ADMIN':
      return '/dashboard/admin';
    case 'SALESMAN':
      return '/dashboard/salesman';
    case 'PRODUCTION_SUPERVISOR':
      return '/dashboard/production';
    case 'ACCOUNTANT':
      return '/dashboard/accountant';
    case 'AUDITOR':
      return '/dashboard/auditor';
    default:
      return '/dashboard';
  }
}
