import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const paymentCountrySettingsTable = pgTable("payment_country_settings", {
  countryCode: text("country_code").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
