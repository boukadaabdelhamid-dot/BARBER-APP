import { asc } from "drizzle-orm";
import { db, paymentCountrySettingsTable } from "@workspace/db";

export const PAYMENT_COUNTRIES = [
  { countryCode: "FR", countryName: "فرنسا", currency: "EUR" },
  { countryCode: "DZ", countryName: "الجزائر", currency: "DZD" },
  { countryCode: "AE", countryName: "الإمارات العربية المتحدة (دبي)", currency: "AED" },
  { countryCode: "QA", countryName: "قطر", currency: "QAR" },
  { countryCode: "SA", countryName: "السعودية", currency: "SAR" },
] as const;

export type PaymentCountryCode = (typeof PAYMENT_COUNTRIES)[number]["countryCode"];

export function isPaymentCountryCode(value: string): value is PaymentCountryCode {
  return PAYMENT_COUNTRIES.some((country) => country.countryCode === value);
}

export async function getPaymentCountries() {
  const savedSettings = await db
    .select()
    .from(paymentCountrySettingsTable)
    .orderBy(asc(paymentCountrySettingsTable.countryCode));
  const enabledByCountry = new Map(
    savedSettings.map(({ countryCode, enabled }) => [countryCode, enabled]),
  );

  return PAYMENT_COUNTRIES.map((country) => {
    const enabled = enabledByCountry.get(country.countryCode) ?? false;
    // Checkout remains unavailable until a payment provider is integrated.
    const providerReady = false;
    return {
      ...country,
      enabled,
      providerReady,
      acceptingPayments: enabled && providerReady,
    };
  });
}
