import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type BarberService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  countryCode: text("country_code"),
  city: text("city").notNull(),
  areas: text("areas").array().notNull(),
  bio: text("bio").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  travelFee: real("travel_fee").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  phone: text("phone").notNull(),
  email: text("email"),
  googleSub: text("google_sub"),
  passwordHash: text("password_hash"),
  accessCodeHash: text("access_code_hash"),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  isAvailable: boolean("is_available").notNull().default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  services: jsonb("services").$type<BarberService[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("barbers_email_unique").on(table.email),
  uniqueIndex("barbers_google_sub_unique").on(table.googleSub),
]);

export const insertBarberSchema = createInsertSchema(barbersTable).omit({
  id: true,
  rating: true,
  reviewCount: true,
  status: true,
  createdAt: true,
});

export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;
