import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  DecideBarberBookingBody,
  DecideBarberBookingParams,
  DecideBarberBookingResponse,
  GetBarberSessionResponse,
  GetBookingStatusQueryParams,
  GetBookingStatusResponse,
  ListBarberBookingsResponse,
  LoginBarberBody,
  LoginBarberResponse,
  LogoutBarberResponse,
} from "@workspace/api-zod";
import { db, barbersTable, bookingsTable } from "@workspace/db";

const router: IRouter = Router();
const BARBER_COOKIE = "barberlink_barber";
const BARBER_COOKIE_PATH = "/api/barber";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const LOGIN_FAILURE_LIMIT = 8;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const failedLoginAttempts = new Map<string, { count: number; expiresAt: number }>();

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function readBarberId(req: Request): number | null {
  const cookieHeader = req.headers.cookie;
  const token = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${BARBER_COOKIE}=`))
    ?.slice(BARBER_COOKIE.length + 1);
  const sessionSecret = process.env.SESSION_SECRET;
  if (!token || !sessionSecret) return null;

  const [idPart, expirationPart, suppliedSignature, ...extra] = token.split(".");
  const barberId = Number(idPart);
  const expiration = Number(expirationPart);
  if (
    extra.length > 0 ||
    !Number.isSafeInteger(barberId) ||
    barberId < 1 ||
    !Number.isSafeInteger(expiration) ||
    expiration <= Date.now() ||
    !suppliedSignature
  ) {
    return null;
  }

  const expectedSignature = createHmac("sha256", sessionSecret)
    .update(`barber:${barberId}:${expiration}`)
    .digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
    ? barberId
    : null;
}

function setBarberCookie(req: Request, res: Response, barberId: number): void {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) throw new Error("SESSION_SECRET is required for barber sessions");
  const expiration = Date.now() + SESSION_DURATION_MS;
  const signature = createHmac("sha256", sessionSecret)
    .update(`barber:${barberId}:${expiration}`)
    .digest("base64url");
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  res.cookie(BARBER_COOKIE, `${barberId}.${expiration}.${signature}`, {
    httpOnly: true,
    secure: req.secure || forwardedProtocol === "https",
    sameSite: "strict",
    path: BARBER_COOKIE_PATH,
    maxAge: SESSION_DURATION_MS,
  });
}

function tooManyLoginAttempts(req: Request, res: Response): boolean {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const attempt = failedLoginAttempts.get(key);
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
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const attempt = failedLoginAttempts.get(key);
  if (!attempt || attempt.expiresAt <= now) {
    failedLoginAttempts.set(key, {
      count: 1,
      expiresAt: now + LOGIN_FAILURE_WINDOW_MS,
    });
  } else {
    attempt.count += 1;
  }
}

function requireBarber(req: Request, res: Response): number | null {
  res.setHeader("Cache-Control", "no-store");
  const barberId = readBarberId(req);
  if (barberId !== null) return barberId;
  res.status(401).json({ error: "Barber authentication required" });
  return null;
}

router.get("/barber/session", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const barberId = readBarberId(req);
  if (barberId === null) {
    res.json(GetBarberSessionResponse.parse({ authenticated: false }));
    return;
  }
  const [barber] = await db
    .select({ id: barbersTable.id, name: barbersTable.name })
    .from(barbersTable)
    .where(eq(barbersTable.id, barberId));
  res.json(
    GetBarberSessionResponse.parse(
      barber
        ? { authenticated: true, barberId: barber.id, barberName: barber.name }
        : { authenticated: false },
    ),
  );
});

router.post("/barber/session", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    res.status(503).json({ error: "Barber authentication is not configured" });
    return;
  }

  const parsed = LoginBarberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (tooManyLoginAttempts(req, res)) return;

  const [barber] = await db
    .select({
      id: barbersTable.id,
      name: barbersTable.name,
      accessCodeHash: barbersTable.accessCodeHash,
    })
    .from(barbersTable)
    .where(eq(barbersTable.id, parsed.data.barberId));
  const suppliedHash = Buffer.from(hash(parsed.data.accessCode));
  const expectedHash = Buffer.from(barber?.accessCodeHash ?? "");
  const valid =
    barber?.accessCodeHash !== null &&
    barber?.accessCodeHash !== undefined &&
    suppliedHash.length === expectedHash.length &&
    timingSafeEqual(suppliedHash, expectedHash);
  if (!valid || !barber) {
    recordFailedLogin(req);
    res.status(401).json({ error: "Invalid barber credentials" });
    return;
  }

  failedLoginAttempts.delete(req.ip || req.socket.remoteAddress || "unknown");
  setBarberCookie(req, res, barber.id);
  res.json(
    LoginBarberResponse.parse({
      authenticated: true,
      barberId: barber.id,
      barberName: barber.name,
    }),
  );
});

router.delete("/barber/session", (_req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  res.clearCookie(BARBER_COOKIE, {
    httpOnly: true,
    sameSite: "strict",
    path: BARBER_COOKIE_PATH,
  });
  res.json(LogoutBarberResponse.parse({ authenticated: false }));
});

router.get("/barber/bookings", async (req, res): Promise<void> => {
  const barberId = requireBarber(req, res);
  if (barberId === null) return;

  const bookings = await db
    .select({
      id: bookingsTable.id,
      status: bookingsTable.status,
      serviceName: bookingsTable.serviceName,
      servicePrice: bookingsTable.servicePrice,
      currency: bookingsTable.currency,
      customerName: bookingsTable.customerName,
      customerPhone: bookingsTable.customerPhone,
      area: bookingsTable.area,
      date: bookingsTable.requestedDate,
      time: bookingsTable.requestedTime,
      note: bookingsTable.note,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.barberId, barberId))
    .orderBy(desc(bookingsTable.createdAt));

  res.json(ListBarberBookingsResponse.parse(bookings));
});

router.patch("/barber/bookings/:bookingId/status", async (req, res): Promise<void> => {
  const barberId = requireBarber(req, res);
  if (barberId === null) return;

  const params = DecideBarberBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = DecideBarberBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(
      and(
        eq(bookingsTable.id, params.data.bookingId),
        eq(bookingsTable.barberId, barberId),
        eq(bookingsTable.status, "requested"),
      ),
    )
    .returning({
      id: bookingsTable.id,
      status: bookingsTable.status,
      serviceName: bookingsTable.serviceName,
      servicePrice: bookingsTable.servicePrice,
      currency: bookingsTable.currency,
      customerName: bookingsTable.customerName,
      customerPhone: bookingsTable.customerPhone,
      area: bookingsTable.area,
      date: bookingsTable.requestedDate,
      time: bookingsTable.requestedTime,
      note: bookingsTable.note,
      createdAt: bookingsTable.createdAt,
    });

  if (!booking) {
    const [existingBooking] = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.id, params.data.bookingId),
          eq(bookingsTable.barberId, barberId),
        ),
      );
    if (!existingBooking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.status(409).json({ error: "Booking was already decided" });
    return;
  }
  res.json(DecideBarberBookingResponse.parse(booking));
});

router.get("/booking-status", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = GetBookingStatusQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [booking] = await db
    .select({
      id: bookingsTable.id,
      status: bookingsTable.status,
      barberName: barbersTable.name,
      serviceName: bookingsTable.serviceName,
      date: bookingsTable.requestedDate,
      time: bookingsTable.requestedTime,
    })
    .from(bookingsTable)
    .innerJoin(barbersTable, eq(bookingsTable.barberId, barbersTable.id))
    .where(
      and(
        eq(bookingsTable.id, parsed.data.bookingId),
        eq(bookingsTable.trackingTokenHash, hash(parsed.data.token)),
      ),
    );

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(GetBookingStatusResponse.parse(booking));
});

export default router;
