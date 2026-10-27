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

const router: IRouter = Router();

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

  const [barber] = await db
    .insert(barbersTable)
    .values({
      ...parsed.data,
      imageUrl: null,
      status: "pending",
    })
    .returning({ id: barbersTable.id });

  res.status(201).json(
    CreateBarberResponse.parse({
      id: barber.id,
      status: "pending",
      message: "تم استلام طلبك. سنتواصل معك بعد مراجعة الملف.",
    }),
  );
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [barber] = await db
    .select()
    .from(barbersTable)
    .where(and(eq(barbersTable.id, parsed.data.barberId), eq(barbersTable.status, "active")));

  if (!barber) {
    res.status(404).json({ error: "Barber not found" });
    return;
  }

  const service = barber.services.find((item) => item.id === parsed.data.serviceId);
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  const requestedDate = parsed.data.date.toISOString().slice(0, 10);
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      barberId: barber.id,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      area: parsed.data.area,
      requestedDate,
      requestedTime: parsed.data.time,
      note: parsed.data.note ?? null,
      status: "requested",
    })
    .returning();

  res.status(201).json(
    CreateBookingResponse.parse({
      id: booking.id,
      status: "requested",
      barberName: barber.name,
      serviceName: service.name,
      date: new Date(`${booking.requestedDate}T00:00:00.000Z`),
      time: booking.requestedTime,
    }),
  );
});

export default router;
