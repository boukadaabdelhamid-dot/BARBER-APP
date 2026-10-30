import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOKING_RESPONSE_TIMEOUT_MS,
  hasBookingResponseTimedOut,
  selectBestAvailableBarber,
  type BookingMatchRequest,
  type MatchableBarber,
} from "./booking-match.ts";

const request: BookingMatchRequest = {
  serviceName: "قص الشعر",
  city: "الدار البيضاء",
  locationMode: "manual",
  area: "المعاريف",
  latitude: null,
  longitude: null,
};

function barber(overrides: Partial<MatchableBarber> = {}): MatchableBarber {
  return {
    id: 1,
    name: "حلاق متاح",
    city: "الدار البيضاء",
    areas: ["المعاريف"],
    services: [{ id: "cut", name: "قص الشعر", durationMinutes: 30, price: 20 }],
    status: "active",
    isAvailable: true,
    rating: 4.8,
    reviewCount: 10,
    latitude: null,
    longitude: null,
    phone: "0600000000",
    currency: "MAD",
    travelFee: 0,
    ...overrides,
  };
}

test("manual region fallback works when the customer does not share GPS", () => {
  const chosen = selectBestAvailableBarber(
    [barber({ isAvailable: false }), barber({ id: 2, name: "متاح" })],
    request,
  );
  assert.equal(chosen?.barber.id, 2);
});

test("manual region matching returns no candidate when no available barber covers it", () => {
  const chosen = selectBestAvailableBarber(
    [barber({ isAvailable: false }), barber({ id: 2, areas: ["الحي الحسني"] })],
    request,
  );
  assert.equal(chosen, null);
});

test("GPS mode cannot match without the customer's consented coordinates", () => {
  const chosen = selectBestAvailableBarber([barber()], {
    ...request,
    locationMode: "gps",
    latitude: null,
    longitude: null,
  });
  assert.equal(chosen, null);
});

test("GPS matching selects the nearest barber inside the coverage radius", () => {
  const chosen = selectBestAvailableBarber(
    [
      barber({ id: 1, name: "الأبعد", latitude: 33.60, longitude: -7.60 }),
      barber({ id: 2, name: "الأقرب", latitude: 33.59, longitude: -7.61 }),
    ],
    {
      ...request,
      locationMode: "gps",
      latitude: 33.59,
      longitude: -7.61,
    },
  );
  assert.equal(chosen?.barber.name, "الأقرب");
});

test("rejecting a barber excludes them and selects the next available match", () => {
  const chosen = selectBestAvailableBarber(
    [barber({ id: 1, name: "الحلاق الأول" }), barber({ id: 2, name: "البديل" })],
    { ...request, excludeBarberIds: [1] },
  );
  assert.equal(chosen?.barber.name, "البديل");
});

test("a request is retried only after the one-minute response window", () => {
  const assignedAt = new Date(1_000_000);
  assert.equal(
    hasBookingResponseTimedOut(assignedAt, assignedAt.getTime() + BOOKING_RESPONSE_TIMEOUT_MS - 1),
    false,
  );
  assert.equal(
    hasBookingResponseTimedOut(assignedAt, assignedAt.getTime() + BOOKING_RESPONSE_TIMEOUT_MS),
    true,
  );
});
