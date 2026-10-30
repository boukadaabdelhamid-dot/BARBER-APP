import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateBarberBody,
  CreateBarberResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBarberParams,
  GetBarberResponse,
  ListBarbersQueryParams,
  ListBarbersResponse,
} from "@workspace/api-zod";
import { db, barbersTable, bookingsTable } from "@workspace/db";
import { hashPassword, normalizeEmail } from "../lib/password";
import { findBestAvailableBarber } from "../lib/booking-dispatch";

const router: IRouter = Router();

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

router.get("/barbers", async (req, res): Promise<void> => {
  const parsed = ListBarbersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filters = [eq(barbersTable.status, "active")];
  if (parsed.data.city?.trim()) {
    filters.push(ilike(barbersTable.city, `%${parsed.data.city.trim()}%`));
  }

  const search = parsed.data.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    filters.push(
      or(
        ilike(barbersTable.name, pattern),
        ilike(barbersTable.city, pattern),
        ilike(barbersTable.bio, pattern),
        sql`${barbersTable.areas}::text ILIKE ${pattern}`,
        sql`${barbersTable.services}::text ILIKE ${pattern}`,
      )!,
    );
  }

  const barbers = await db
    .select()
    .from(barbersTable)
    .where(and(...filters))
    .orderBy(desc(barbersTable.rating), desc(barbersTable.reviewCount));

  res.json(ListBarbersResponse.parse(barbers));
});

router.get("/barbers/:barberId", async (req, res): Promise<void> => {
  const params = GetBarberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [barber] = await db
    .select()
    .from(barbersTable)
    .where(and(eq(barbersTable.id, params.data.barberId), eq(barbersTable.status, "active")));

  if (!barber) {
    res.status(404).json({ error: "Barber not found" });
    return;
  }

  res.json(GetBarberResponse.parse(barber));
});

router.post("/barbers", async (req, res): Promise<void> => {
  const parsed = CreateBarberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email: submittedEmail, password, ...profile } = parsed.data;
  const email = normalizeEmail(submittedEmail);
  const [existingEmail] = await db
    .select({ id: barbersTable.id })
    .from(barbersTable)
    .where(eq(barbersTable.email, email))
    .limit(1);
  if (existingEmail) {
    res.status(409).json({ error: "This email is already registered" });
    return;
  }

  const accessCode = randomBytes(32).toString("base64url");
  const accessCodeHash = createHash("sha256").update(accessCode).digest("hex");
  let barberId: number;
  try {
    const [createdBarber] = await db
      .insert(barbersTable)
      .values({
        ...profile,
        email,
        passwordHash: await hashPassword(password),
        accessCodeHash,
        imageUrl: null,
        status: "pending",
      })
      .returning({ id: barbersTable.id });
    barberId = createdBarber.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "This email is already registered" });
      return;
    }
    throw error;
  }

  res.status(201).json(
    CreateBarberResponse.parse({
      id: barberId,
      status: "pending",
      message: "تم استلام طلبك. سنتواصل معك بعد مراجعة الملف.",
      accessCode,
    }),
  );
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const area = parsed.data.area?.trim() ?? "";
  if (
    (parsed.data.locationMode === "manual" && area.length < 2) ||
    (parsed.data.locationMode === "gps" &&
      (parsed.data.latitude == null || parsed.data.longitude == null))
  ) {
    res.status(400).json({ error: "Provide a region or an approved location." });
    return;
  }

  const match = await findBestAvailableBarber({
    serviceName: parsed.data.serviceName,
    city: parsed.data.city,
    locationMode: parsed.data.locationMode,
    area,
    latitude: parsed.data.locationMode === "gps" ? parsed.data.latitude ?? null : null,
    longitude: parsed.data.locationMode === "gps" ? parsed.data.longitude ?? null : null,
  });
  if (!match) {
    res.status(409).json({
      error: "No available barber currently covers this service and location.",
    });
    return;
  }

  const requestedDate = parsed.data.date.toISOString().slice(0, 10);
  const trackingToken = randomBytes(32).toString("base64url");
  const trackingTokenHash = createHash("sha256").update(trackingToken).digest("hex");
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      barberId: match.barber.id,
      serviceId: match.service.id,
      serviceName: match.service.name,
      servicePrice: match.service.price,
      currency: match.barber.currency,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      city: parsed.data.city.trim(),
      area: area || "موقعي الحالي",
      locationMode: parsed.data.locationMode,
      latitude: parsed.data.locationMode === "gps" ? parsed.data.latitude ?? null : null,
      longitude: parsed.data.locationMode === "gps" ? parsed.data.longitude ?? null : null,
      requestedDate,
      requestedTime: parsed.data.time,
      note: parsed.data.note ?? null,
      status: "requested",
      trackingTokenHash,
      attemptedBarberIds: [],
      assignedAt: new Date(),
    })
    .returning();

  res.status(201).json(
    CreateBookingResponse.parse({
      id: booking.id,
      status: "requested",
      barberName: match.barber.name,
      barberPhone: match.barber.phone,
      serviceName: match.service.name,
      servicePrice: match.service.price,
      travelFee: match.barber.travelFee,
      currency: match.barber.currency,
      date: new Date(`${booking.requestedDate}T00:00:00.000Z`),
      time: booking.requestedTime,
      trackingToken,
      attemptCount: 1,
    }),
  );
});

export default router;
