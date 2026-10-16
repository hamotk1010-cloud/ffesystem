import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'workspace-ffe-super-secret-key-2026';

export interface AdminPayload {
  id: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminPayload;
}

export function generateToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized: Session expired or token invalid' });
    return;
  }

  req.admin = decoded;
  next();
}
