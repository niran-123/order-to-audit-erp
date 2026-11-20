import { Request, Response, NextFunction } from 'express';
import { authenticateUser, rotateRefreshToken, logoutUser } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { prisma } from '../../services/prisma';

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authenticateUser(email, password, ipAddress, userAgent);

    return sendSuccess(res, result, 'Authentication successful');
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await rotateRefreshToken(refreshToken, ipAddress, userAgent);

    return sendSuccess(res, result, 'Session refreshed successfully');
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;

    await logoutUser(refreshToken, userId, ipAddress);

    return sendSuccess(res, { loggedOut: true }, 'Signed out successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        userRoles: {
          select: { role: { select: { name: true, description: true } } },
        },
      },
    });

    return sendSuccess(
      res,
      {
        user,
        roles: req.user.roles,
        permissions: req.user.permissions,
      },
      'Current user profile',
    );
  } catch (error) {
    next(error);
  }
}
