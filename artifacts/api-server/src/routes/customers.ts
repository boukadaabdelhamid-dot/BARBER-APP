import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCustomerSessionResponse,
  LoginCustomerWithGoogleBody,
  LoginCustomerWithGoogleResponse,
  LogoutCustomerResponse,
} from "@workspace/api-zod";
import { db, customersTable } from "@workspace/db";
import {
  GoogleAuthNotConfiguredError,
  isTrustedBrowserOrigin,
  verifyGoogleCredential,
} from "../lib/google-identity";

const router: IRouter = Router();
const CUSTOMER_COOKIE = "barberlink_customer";
const CUSTOMER_COOKIE_PATH = "/api/customer";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function readCustomerId(req: Request): number | null {
  const token = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CUSTOMER_COOKIE}=`))
    ?.slice(CUSTOMER_COOKIE.length + 1);
  const sessionSecret = process.env.SESSION_SECRET;
  if (!token || !sessionSecret) return null;

  const [idPart, expirationPart, suppliedSignature, ...extra] = token.split(".");
  const customerId = Number(idPart);
  const expiration = Number(expirationPart);
  if (
    extra.length > 0 ||
    !Number.isSafeInteger(customerId) ||
    customerId < 1 ||
    !Number.isSafeInteger(expiration) ||
    expiration <= Date.now() ||
    !suppliedSignature
  ) {
    return null;
  }

  const expectedSignature = createHmac("sha256", sessionSecret)
    .update(`customer:${customerId}:${expiration}`)
    .digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
    ? customerId
    : null;
}

function setCustomerCookie(req: Request, res: Response, customerId: number): void {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) throw new Error("SESSION_SECRET is required for customer sessions");
  const expiration = Date.now() + SESSION_DURATION_MS;
  const signature = createHmac("sha256", sessionSecret)
    .update(`customer:${customerId}:${expiration}`)
    .digest("base64url");
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  res.cookie(CUSTOMER_COOKIE, `${customerId}.${expiration}.${signature}`, {
    httpOnly: true,
    secure: req.secure || forwardedProtocol === "https",
    sameSite: "strict",
    path: CUSTOMER_COOKIE_PATH,
    maxAge: SESSION_DURATION_MS,
  });
}

function sessionResult(
  customer?: { id: number; name: string; email: string },
): { authenticated: boolean; customerId?: number; customerName?: string; email?: string } {
  return customer
    ? {
        authenticated: true,
        customerId: customer.id,
        customerName: customer.name,
        email: customer.email,
      }
    : { authenticated: false };
}

router.get("/customer/session", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const customerId = readCustomerId(req);
  if (customerId === null) {
    res.json(GetCustomerSessionResponse.parse({ authenticated: false }));
    return;
  }

  const [customer] = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      email: customersTable.email,
    })
    .from(customersTable)
    .where(eq(customersTable.id, customerId))
    .limit(1);
  res.json(GetCustomerSessionResponse.parse(sessionResult(customer)));
});

router.delete("/customer/session", (req, res): void => {
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  res.clearCookie(CUSTOMER_COOKIE, {
    httpOnly: true,
    secure: req.secure || forwardedProtocol === "https",
    sameSite: "strict",
    path: CUSTOMER_COOKIE_PATH,
  });
  res.json(LogoutCustomerResponse.parse({ authenticated: false }));
});

router.post("/customer/google-session", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  if (!isTrustedBrowserOrigin(req)) {
    res.status(403).json({ error: "Untrusted request origin" });
    return;
  }
  if (!process.env.SESSION_SECRET) {
    res.status(503).json({ error: "Customer authentication is not configured" });
    return;
  }

  const parsed = LoginCustomerWithGoogleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let identity;
  try {
    identity = await verifyGoogleCredential(parsed.data.credential);
  } catch (error) {
    if (error instanceof GoogleAuthNotConfiguredError) {
      res.status(503).json({ error: "Google authentication is not configured" });
    } else {
      res.status(401).json({ error: "Invalid Google credential" });
    }
    return;
  }

  let [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.googleSub, identity.googleSub))
    .limit(1);

  if (!customer) {
    const [existingEmail] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, identity.email))
      .limit(1);
    if (existingEmail && existingEmail.googleSub !== identity.googleSub) {
      res.status(409).json({ error: "This email is linked to another Google account" });
      return;
    }
    if (existingEmail) {
      customer = existingEmail;
    } else {
      try {
        [customer] = await db
          .insert(customersTable)
          .values({
            googleSub: identity.googleSub,
            email: identity.email,
            name: identity.name,
          })
          .returning();
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          [customer] = await db
            .select()
            .from(customersTable)
            .where(eq(customersTable.googleSub, identity.googleSub))
            .limit(1);
        } else {
          throw error;
        }
      }
    }
  }

  if (!customer) {
    res.status(409).json({ error: "Could not link this Google account" });
    return;
  }

  setCustomerCookie(req, res, customer.id);
  res.json(
    LoginCustomerWithGoogleResponse.parse({
      authenticated: true,
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
    }),
  );
});

export default router;
