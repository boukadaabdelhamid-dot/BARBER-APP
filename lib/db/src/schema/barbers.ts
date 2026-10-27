import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
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
  city: text("city").notNull(),
  areas: text("areas").array().notNull(),
  bio: text("bio").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  travelFee: real("travel_fee").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  phone: text("phone").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"),
  services: jsonb("services").$type<BarberService[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBarberSchema = createInsertSchema(barbersTable).omit({
  id: true,
  rating: true,
  reviewCount: true,
  status: true,
  createdAt: true,
});

export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;
