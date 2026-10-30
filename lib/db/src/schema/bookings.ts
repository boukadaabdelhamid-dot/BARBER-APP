import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { barbersTable } from "./barbers";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbersTable.id),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  servicePrice: real("service_price").notNull(),
  currency: text("currency").notNull().default("EUR"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  city: text("city").notNull().default(""),
  area: text("area").notNull(),
  locationMode: text("location_mode").notNull().default("manual"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  requestedDate: date("requested_date", { mode: "string" }).notNull(),
  requestedTime: text("requested_time").notNull(),
  note: text("note"),
  status: text("status").notNull().default("requested"),
  lastAttemptReason: text("last_attempt_reason"),
  attemptedBarberIds: integer("attempted_barber_ids").array().notNull().default([]),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  trackingTokenHash: text("tracking_token_hash").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
