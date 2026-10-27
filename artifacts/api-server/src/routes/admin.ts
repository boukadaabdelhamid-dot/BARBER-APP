import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetAdminSessionResponse,
  IssueBarberAccessCodeParams,
  IssueBarberAccessCodeResponse,
  ListPendingBarbersResponse,
  LoginAdminBody,
  LoginAdminResponse,
  LogoutAdminResponse,
  ModerateBarberBody,
  ModerateBarberParams,
  ModerateBarberResponse,
} from "@workspace/api-zod";
import { db, barbersTable } from "@workspace/db";

const router: IRouter = Router();
const ADMIN_COOKIE = "barberlink_admin";
const ADMIN_COOKIE_PATH = "/api/admin";
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const LOGIN_FAILURE_LIMIT = 8;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const failedLoginAttempts = new Map<string, { count: number; expiresAt: number }>();

function loginAttemptKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isLoginRateLimited(req: Request, res: Response): boolean {
  const key = loginAttemptKey(req);
  const attempt = failedLoginAttempts.get(key);
  const now = Date.now();

  if (!attempt || attempt.expiresAt <= now) {
    failedLoginAttempts.delete(key);
    return false;
  }

  if (attempt.count < LOGIN_FAILURE_LIMIT) return false;

  res.setHeader("Retry-After", String(Math.ceil((attempt.expiresAt - now) / 1000)));
  res.status(429).json({ error: "Too many login attempts. Try again later." });
  return true;
}

function recordFailedLogin(req: Request): void {
  const now = Date.now();
  const key = loginAttemptKey(req);
  const attempt = failedLoginAttempts.get(key);

  if (!attempt || attempt.expiresAt <= now) {
    failedLoginAttempts.set(key, {
      count: 1,
      expiresAt: now + LOGIN_FAILURE_WINDOW_MS,
    });
  } else {
    attempt.count += 1;
  }

  if (failedLoginAttempts.size > 1000) {
    for (const [attemptKey, value] of failedLoginAttempts) {
      if (value.expiresAt <= now) failedLoginAttempts.delete(attemptKey);
    }
  }
}

function readAdminCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`));

  return cookie?.slice(ADMIN_COOKIE.length + 1) ?? null;
}

function signatureFor(expiration: string, sessionSecret: string): string {
  return createHmac("sha256", sessionSecret)
    .update(`barberlink-admin:${expiration}`)
    .digest("base64url");
}

function hasValidSession(req: Request): boolean {
  const sessionSecret = process.env.SESSION_SECRET;
  const token = readAdminCookie(req);
  if (!sessionSecret || !token) return false;

  const separator = token.indexOf(".");
  if (separator < 1) return false;

  const expiration = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const expirationTime = Number(expiration);
  if (!Number.isSafeInteger(expirationTime) || expirationTime <= Date.now()) {
    return false;
  }

  const expectedSignature = signatureFor(expiration, sessionSecret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function setAdminCookie(req: Request, res: Response): void {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) throw new Error("SESSION_SECRET is required for admin sessions");

  const expiration = String(Date.now() + ADMIN_SESSION_DURATION_MS);
  const token = `${expiration}.${signatureFor(expiration, sessionSecret)}`;
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();

  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: req.secure || forwardedProtocol === "https",
    sameSite: "strict",
    path: ADMIN_COOKIE_PATH,
    maxAge: ADMIN_SESSION_DURATION_MS,
  });
}

function requireAdmin(req: Request, res: Response): boolean {
  res.setHeader("Cache-Control", "no-store");
  if (hasValidSession(req)) return true;

  res.status(401).json({ error: "Admin authentication required" });
  return false;
}

function safePasswordMatch(suppliedPassword: string, expectedPassword: string): boolean {
  const suppliedHash = createHash("sha256").update(suppliedPassword).digest();
  const expectedHash = createHash("sha256").update(expectedPassword).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}

router.get("/admin/session", (req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  res.json(GetAdminSessionResponse.parse({ authenticated: hasValidSession(req) }));
});

router.post("/admin/session", (req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  const adminPassword = process.env.BARBERLINK_ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    res.status(503).json({ error: "Admin authentication is not configured" });
    return;
  }

  const parsed = LoginAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (isLoginRateLimited(req, res)) return;

  if (!safePasswordMatch(parsed.data.password, adminPassword)) {
    recordFailedLogin(req);
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  failedLoginAttempts.delete(loginAttemptKey(req));
  setAdminCookie(req, res);
  res.json(LoginAdminResponse.parse({ authenticated: true }));
});

router.delete("/admin/session", (_req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  res.clearCookie(ADMIN_COOKIE, {
    httpOnly: true,
    sameSite: "strict",
    path: ADMIN_COOKIE_PATH,
  });
  res.json(LogoutAdminResponse.parse({ authenticated: false }));
});

router.get("/admin/barbers", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const barbers = await db
    .select()
    .from(barbersTable)
    .where(eq(barbersTable.status, "pending"))
    .orderBy(asc(barbersTable.createdAt));

  res.json(ListPendingBarbersResponse.parse(barbers));
});

router.post("/admin/barbers/:barberId/access-code", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  const params = IssueBarberAccessCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const accessCode = randomBytes(32).toString("base64url");
  const accessCodeHash = createHash("sha256").update(accessCode).digest("hex");
  const [barber] = await db
    .update(barbersTable)
    .set({ accessCodeHash })
    .where(
      and(
        eq(barbersTable.id, params.data.barberId),
        eq(barbersTable.status, "active"),
      ),
    )
    .returning({ id: barbersTable.id });
  if (!barber) {
    res.status(404).json({ error: "Active barber not found" });
    return;
  }

  res.json(IssueBarberAccessCodeResponse.parse({ barberId: barber.id, accessCode }));
});

router.patch("/admin/barbers/:barberId/status", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = ModerateBarberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ModerateBarberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [barber] = await db
    .update(barbersTable)
    .set({ status: parsed.data.status })
    .where(
      and(
        eq(barbersTable.id, params.data.barberId),
        eq(barbersTable.status, "pending"),
      ),
    )
    .returning();

  if (!barber) {
    const [existingBarber] = await db
      .select({ id: barbersTable.id })
      .from(barbersTable)
      .where(eq(barbersTable.id, params.data.barberId));

    if (!existingBarber) {
      res.status(404).json({ error: "Pending profile not found" });
      return;
    }

    res.status(409).json({ error: "Profile was already reviewed" });
    return;
  }

  res.json(ModerateBarberResponse.parse(barber));
});

export default router;
