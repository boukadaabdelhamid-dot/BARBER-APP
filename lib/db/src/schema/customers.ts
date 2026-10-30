import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  googleSub: text("google_sub").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("customers_google_sub_unique").on(table.googleSub),
  uniqueIndex("customers_email_unique").on(table.email),
]);

export type Customer = typeof customersTable.$inferSelect;
