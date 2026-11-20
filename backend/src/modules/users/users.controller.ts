import { Request, Response, NextFunction } from 'express';
import { createNewUser, updateUserActiveStatus, listAllUsers } from './users.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function createUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorId = req.user?.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const user = await createNewUser(req.body, creatorId, ipAddress);

    return sendSuccess(res, user, 'New system user provisioned successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;
    const adminId = req.user?.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await updateUserActiveStatus(id, isActive, reason, adminId, ipAddress);

    const actionWord = isActive ? 'activated' : 'deactivated';
    return sendSuccess(res, updated, `User account ${actionWord} successfully`);
  } catch (error) {
    next(error);
  }
}

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await listAllUsers(page, limit);

    return sendSuccess(res, result.users, 'User directory retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
}
