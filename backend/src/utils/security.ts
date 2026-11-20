import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UnauthorizedError } from './appError';
import { SystemRole } from '@prisma/client';

export interface TokenUserPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: SystemRole[];
  permissions: string[];
}

export interface DecodedAccessToken extends TokenUserPayload {
  iat: number;
  exp: number;
}

const SALT_ROUNDS = 10;

/**
 * Securely hashes a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text candidate password with an existing bcrypt hash.
 */
export async function comparePassword(candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
}

/**
 * Signs a short-lived JSON Web Access Token (default 15 minutes).
 */
export function generateAccessToken(payload: TokenUserPayload, expiresIn: any = '15m'): string {
  const options: jwt.SignOptions = {
    expiresIn,
    issuer: 'order-to-audit-erp',
    audience: 'order-to-audit-client',
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Generates an opaque, cryptographically secure 64-byte random hex string for refresh tokens.
 */
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Verifies and decodes an access token. Throws UnauthorizedError if invalid or expired.
 */
export function verifyAccessToken(token: string): DecodedAccessToken {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'order-to-audit-erp',
      audience: 'order-to-audit-client',
    }) as DecodedAccessToken;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token has expired. Please refresh your session.', {
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    }
    throw new UnauthorizedError('Invalid or corrupted authentication token', {
      code: 'INVALID_TOKEN',
    });
  }
}
