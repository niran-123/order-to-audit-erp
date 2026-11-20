import { prisma } from '../../services/prisma';
import { hashPassword } from '../../utils/security';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/appError';
import { recordSecurityAudit } from '../audit/audit.service';
import { CreateUserInput } from './users.schema';

export async function createNewUser(input: CreateUserInput, creatorId?: string, ipAddress?: string) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new BadRequestError(`User with email '${normalizedEmail}' already exists in directory.`);
  }

  // Find Role ID
  const roleRecord = await prisma.role.findUnique({
    where: { name: input.role },
  });

  if (!roleRecord) {
    throw new BadRequestError(`System role '${input.role}' does not exist in the database.`);
  }

  const hashedPassword = await hashPassword(input.password);

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      isActive: true,
      userRoles: {
        create: {
          roleId: roleRecord.id,
          assignedBy: creatorId,
        },
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      createdAt: true,
      userRoles: {
        select: { role: { select: { name: true } } },
      },
    },
  });

  await recordSecurityAudit({
    userId: creatorId,
    entityName: 'USER_MANAGEMENT',
    entityId: newUser.id,
    actionType: 'CREATE',
    ipAddress,
    newValues: {
      email: newUser.email,
      role: input.role,
      createdBy: creatorId,
    },
  });

  return newUser;
}

export async function updateUserActiveStatus(
  targetUserId: string,
  isActive: boolean,
  reason: string,
  adminUserId?: string,
  ipAddress?: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  if (!user) {
    throw new NotFoundError(`User with ID '${targetUserId}' was not found.`);
  }

  // Guard: Protect against deactivating oneself
  if (adminUserId && targetUserId === adminUserId && !isActive) {
    throw new ForbiddenError('Security Invariant: Administrators cannot deactivate their own active user account.');
  }

  // Guard: Check if target user is an Owner; only another Owner can deactivate an Owner
  const isTargetOwner = user.userRoles.some((ur) => ur.role.name === 'OWNER');
  if (isTargetOwner && !isActive) {
    const ownerCount = await prisma.userRole.count({
      where: {
        role: { name: 'OWNER' },
        user: { isActive: true },
      },
    });

    if (ownerCount <= 1) {
      throw new ForbiddenError('Governance Invariant: Cannot deactivate the sole active Business Owner of the organization.');
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      updatedAt: true,
    },
  });

  // If deactivated, revoke all outstanding refresh tokens immediately
  if (!isActive) {
    await prisma.refreshToken.updateMany({
      where: { userId: targetUserId },
      data: { isRevoked: true },
    });
  }

  await recordSecurityAudit({
    userId: adminUserId,
    entityName: 'USER_MANAGEMENT',
    entityId: targetUserId,
    actionType: 'UPDATE',
    ipAddress,
    oldValues: { isActive: user.isActive },
    newValues: { isActive, reason, changedBy: adminUserId },
  });

  return updated;
}

export async function listAllUsers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: { role: { select: { name: true } } },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      roles: u.userRoles.map((r) => r.role.name),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
