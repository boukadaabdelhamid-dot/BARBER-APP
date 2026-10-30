export const BOOKING_RESPONSE_TIMEOUT_MS = 60_000;
export const GPS_COVERAGE_RADIUS_KM = 30;

export type BookingMatchRequest = {
  serviceName: string;
  city: string;
  locationMode: "manual" | "gps";
  area: string;
  latitude: number | null;
  longitude: number | null;
  excludeBarberIds?: number[];
};

export type MatchableBarber = {
  id: number;
  name: string;
  city: string;
  areas: string[];
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  }>;
  status: string;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  currency: string;
  travelFee: number;
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function distanceInKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(latitudeB - latitudeA);
  const deltaLongitude = radians(longitudeB - longitudeA);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(haversine));
}

export function selectBestAvailableBarber(
  barbers: MatchableBarber[],
  request: BookingMatchRequest,
) {
  if (
    request.locationMode === "gps" &&
    (request.latitude === null || request.longitude === null)
  ) {
    return null;
  }
  if (request.locationMode === "manual" && !request.area.trim()) return null;

  const excluded = new Set(request.excludeBarberIds ?? []);
  const matches: Array<{
    barber: MatchableBarber;
    service: MatchableBarber["services"][number];
    distanceKm: number | null;
  }> = [];

  for (const barber of barbers) {
    if (
      excluded.has(barber.id) ||
      barber.status !== "active" ||
      !barber.isAvailable ||
      normalize(barber.city) !== normalize(request.city)
    ) {
      continue;
    }
    const service = barber.services.find(
      (item) => normalize(item.name) === normalize(request.serviceName),
    );
    if (!service) continue;

    if (request.locationMode === "manual") {
      const covered = barber.areas.some(
        (area) => normalize(area) === normalize(request.area),
      );
      if (covered) matches.push({ barber, service, distanceKm: null });
      continue;
    }

    if (
      request.latitude === null ||
      request.longitude === null ||
      barber.latitude === null ||
      barber.longitude === null
    ) {
      continue;
    }
    const distanceKm = distanceInKm(
      request.latitude,
      request.longitude,
      barber.latitude,
      barber.longitude,
    );
    if (distanceKm <= GPS_COVERAGE_RADIUS_KM) {
      matches.push({ barber, service, distanceKm });
    }
  }

  matches.sort((a, b) => {
    if (request.locationMode === "gps") {
      return (
        (a.distanceKm ?? Number.POSITIVE_INFINITY) -
          (b.distanceKm ?? Number.POSITIVE_INFINITY) ||
        b.barber.rating - a.barber.rating ||
        b.barber.reviewCount - a.barber.reviewCount
      );
    }
    return (
      b.barber.rating - a.barber.rating ||
      b.barber.reviewCount - a.barber.reviewCount
    );
  });
  return matches[0] ?? null;
}

export function hasBookingResponseTimedOut(
  assignedAt: Date,
  now = Date.now(),
): boolean {
  return now - assignedAt.getTime() >= BOOKING_RESPONSE_TIMEOUT_MS;
}
