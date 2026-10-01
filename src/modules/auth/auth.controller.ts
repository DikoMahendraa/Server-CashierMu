import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { LoginDto, RefreshDto } from './auth.schema';

const loginAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

function checkLock(key: string): boolean {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;
  if (attempt.lockedUntil && attempt.lockedUntil > new Date()) return true;
  return false;
}

function recordFailure(key: string): void {
  const attempt = loginAttempts.get(key) || { count: 0 };
  attempt.count += 1;
  if (attempt.count >= env.MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = new Date(Date.now() + env.LOGIN_LOCKOUT_MINUTES * 60 * 1000);
    attempt.count = 0;
  }
  loginAttempts.set(key, attempt);
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

function signAccessToken(payload: object): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

function signRefreshToken(payload: object): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credential, pin } = req.body as LoginDto;
    const ip = req.ip || 'unknown';

    if (checkLock(ip)) {
      res.status(429).json({ message: `Too many failed attempts. Try again in ${env.LOGIN_LOCKOUT_MINUTES} minutes.` });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: credential }, { phone: credential }],
        isActive: true,
      },
    });

    if (!user) {
      recordFailure(ip);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const pinMatch = await bcrypt.compare(pin, user.pinHash);
    if (!pinMatch) {
      recordFailure(ip);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    clearAttempts(ip);

    const tokenPayload = { userId: user.id, role: user.role, branchId: user.branchId };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: { id: user.id, name: user.name, role: user.role, branchId: user.branchId },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshDto;

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    let payload: { userId: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role, branchId: user.branchId });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshDto;
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, branchId: true, avatarUrl: true, isActive: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
