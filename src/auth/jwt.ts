import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { AuthPayload, User } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  const payload: AuthPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] ?? null;
}
