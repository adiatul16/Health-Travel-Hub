import { Router } from "express";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "admin-jwt-secret-fallback-change-in-production";

const secret = new TextEncoder().encode(ADMIN_JWT_SECRET);

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function adminAuthMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  verifyAdminToken(token).then((ok) => {
    if (ok) {
      req.adminAuth = true;
      next();
    } else {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  }).catch(() => res.status(401).json({ error: "Invalid token" }));
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) return false;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const ok = await verifyAdminPassword(password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = await createAdminToken();
    return res.json({ token, role: "admin" });
  } catch (err) {
    req.log.error({ err }, "Admin login failed");
    return res.status(500).json({ error: "Login failed" });
  }
});

adminAuthRouter.get("/verify", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.json({ valid: false });
    }
    const token = auth.slice(7);
    const ok = await verifyAdminToken(token);
    return res.json({ valid: ok });
  } catch (err) {
    return res.json({ valid: false });
  }
});
