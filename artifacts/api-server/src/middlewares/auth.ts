import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).auth;
  if (!auth?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireAuthOrAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).auth;
  if (!auth?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
