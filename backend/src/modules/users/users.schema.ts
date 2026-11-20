import { z } from 'zod';
import { SystemRole } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Valid corporate email address required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phone: z.string().optional(),
    role: z.nativeEnum(SystemRole, { errorMap: () => ({ message: 'Invalid system role selected' }) }),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID parameter'),
  }),
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive boolean flag is required' }),
    reason: z.string().min(5, 'Reason for status change must be provided for audit traceability'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>['body'];
