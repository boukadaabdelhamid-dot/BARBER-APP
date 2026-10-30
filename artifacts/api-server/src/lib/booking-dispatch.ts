import { and, eq } from "drizzle-orm";
import {
  db,
  barbersTable,
  bookingsTable,
  type Booking,
} from "@workspace/db";
import {
  selectBestAvailableBarber,
  type BookingMatchRequest,
} from "./booking-match";

export { BOOKING_RESPONSE_TIMEOUT_MS, hasBookingResponseTimedOut } from "./booking-match";

export async function findBestAvailableBarber(request: BookingMatchRequest) {
  const barbers = await db
    .select()
    .from(barbersTable)
    .where(
      and(
        eq(barbersTable.status, "active"),
        eq(barbersTable.isAvailable, true),
      ),
    );
  return selectBestAvailableBarber(barbers, request);
}

export async function assignNextBarber(
  booking: Booking,
  declinedBarberId: number,
  reason: "rejected" | "timeout",
): Promise<"reassigned" | "unavailable" | "stale"> {
  if (
    booking.status !== "requested" ||
    booking.barberId !== declinedBarberId
  ) {
    return "stale";
  }

  const attemptedBarberIds = Array.from(
    new Set([...booking.attemptedBarberIds, declinedBarberId]),
  );
  const next = await findBestAvailableBarber({
    serviceName: booking.serviceName,
    countryCode: booking.countryCode,
    city: booking.city,
    area: booking.area,
    locationMode: booking.locationMode as "manual" | "gps",
    latitude: booking.latitude,
    longitude: booking.longitude,
    excludeBarberIds: attemptedBarberIds,
  });
  const matchCondition = and(
    eq(bookingsTable.id, booking.id),
    eq(bookingsTable.barberId, declinedBarberId),
    eq(bookingsTable.status, "requested"),
    eq(bookingsTable.assignedAt, booking.assignedAt),
  );

  if (!next) {
    const [updated] = await db
      .update(bookingsTable)
      .set({
        status: "unavailable",
        lastAttemptReason: reason,
        attemptedBarberIds,
        assignedAt: new Date(),
        latitude: null,
        longitude: null,
      })
      .where(matchCondition)
      .returning({ id: bookingsTable.id });
    return updated ? "unavailable" : "stale";
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({
      barberId: next.barber.id,
      serviceId: next.service.id,
      serviceName: next.service.name,
      servicePrice: next.service.price,
      currency: next.barber.currency,
      attemptedBarberIds,
      lastAttemptReason: reason,
      assignedAt: new Date(),
    })
    .where(matchCondition)
    .returning({ id: bookingsTable.id });
  return updated ? "reassigned" : "stale";
}
