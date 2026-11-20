import { prisma } from '../../services/prisma';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshTokenString,
  TokenUserPayload,
} from '../../utils/security';
import { UnauthorizedError, ForbiddenError } from '../../utils/appError';
import { ROLE_PERMISSION_MATRIX, getRoleDashboardRedirect } from '../../config/permissions';
import { recordSecurityAudit } from '../audit/audit.service';
import { SystemRole } from '@prisma/client';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    roles: SystemRole[];
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
  redirectUrl: string;
}

/**
 * Authenticates user credentials, generates JWT access and refresh tokens,
 * and maintains security audit logs.
 */
export async function authenticateUser(
  email: string,
  candidatePassword: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    await recordSecurityAudit({
      entityName: 'AUTH_SESSION',
      entityId: normalizedEmail,
      actionType: 'LOGIN_FAILURE',
      ipAddress,
      userAgent,
      newValues: { reason: 'USER_NOT_FOUND' },
    });
    throw new UnauthorizedError('Invalid email or password credentials');
  }

  const isPasswordValid = await comparePassword(candidatePassword, user.passwordHash);

  if (!isPasswordValid) {
    await recordSecurityAudit({
      userId: user.id,
      entityName: 'AUTH_SESSION',
      entityId: user.id,
      actionType: 'LOGIN_FAILURE',
      ipAddress,
      userAgent,
      newValues: { reason: 'INVALID_PASSWORD' },
    });
    throw new UnauthorizedError('Invalid email or password credentials');
  }

  if (!user.isActive) {
    await recordSecurityAudit({
      userId: user.id,
      entityName: 'AUTH_SESSION',
      entityId: user.id,
      actionType: 'LOGIN_FAILURE',
      ipAddress,
      userAgent,
      newValues: { reason: 'ACCOUNT_DEACTIVATED' },
    });
    throw new ForbiddenError('Your account has been deactivated. Please contact an administrator.', {
      code: 'ACCOUNT_DEACTIVATED',
    });
  }

  // Aggregate user roles
  const roles: SystemRole[] = user.userRoles.map((ur) => ur.role.name);
  if (roles.length === 0) {
    roles.push('SALESMAN'); // Fallback default role
  }

  // Aggregate unique permissions from the role matrix
  const permissionSet = new Set<string>();
  roles.forEach((role) => {
    const perms = ROLE_PERMISSION_MATRIX[role] || [];
    perms.forEach((p) => permissionSet.add(p));
  });
  const permissions = Array.from(permissionSet);

  const tokenPayload: TokenUserPayload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions,
  };

  // Generate Tokens
  const accessToken = generateAccessToken(tokenPayload, '15m');
  const refreshTokenString = generateRefreshTokenString();

  // Store Refresh Token in DB with 7-day expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  // Update user last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Record successful login audit log
  await recordSecurityAudit({
    userId: user.id,
    entityName: 'AUTH_SESSION',
    entityId: user.id,
    actionType: 'LOGIN_SUCCESS',
    ipAddress,
    userAgent,
    newValues: { roles },
  });

  const primaryRole = roles[0];
  const redirectUrl = getRoleDashboardRedirect(primaryRole);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles,
      permissions,
    },
    accessToken,
    refreshToken: refreshTokenString,
    redirectUrl,
  };
}

/**
 * Validates a refresh token and performs token rotation.
 */
export async function rotateRefreshToken(
  oldRefreshToken: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: {
      user: {
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      },
    },
  });

  if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid, expired or revoked refresh token. Please sign in again.', {
      code: 'REFRESH_TOKEN_INVALID',
    });
  }

  const { user } = tokenRecord;

  if (!user.isActive) {
    throw new ForbiddenError('Account is deactivated.', { code: 'ACCOUNT_DEACTIVATED' });
  }

  // Revoke old refresh token (Token Rotation Security Pattern)
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { isRevoked: true },
  });

  // Calculate permissions
  const roles: SystemRole[] = user.userRoles.map((ur) => ur.role.name);
  const permissionSet = new Set<string>();
  roles.forEach((r) => {
    (ROLE_PERMISSION_MATRIX[r] || []).forEach((p) => permissionSet.add(p));
  });

  const tokenPayload: TokenUserPayload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions: Array.from(permissionSet),
  };

  const newAccessToken = generateAccessToken(tokenPayload, '15m');
  const newRefreshTokenString = generateRefreshTokenString();

  await prisma.refreshToken.create({
    data: {
      token: newRefreshTokenString,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenString,
  };
}

/**
 * Revokes refresh token and records logout audit log.
 */
export async function logoutUser(refreshToken: string, userId?: string, ipAddress?: string): Promise<void> {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  if (userId) {
    await recordSecurityAudit({
      userId,
      entityName: 'AUTH_SESSION',
      entityId: userId,
      actionType: 'LOGOUT',
      ipAddress,
    });
  }
}
