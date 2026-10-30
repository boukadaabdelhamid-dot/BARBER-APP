import type { Request } from "express";
import { OAuth2Client } from "google-auth-library";

export type GoogleIdentity = {
  googleSub: string;
  email: string;
  name: string;
};

export class GoogleAuthNotConfiguredError extends Error {}
export class InvalidGoogleCredentialError extends Error {}

const googleClient = new OAuth2Client();

function toOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isTrustedBrowserOrigin(req: Request): boolean {
  const origin = req.get("origin");
  if (process.env.NODE_ENV !== "production") return true;
  if (!origin) return false;

  const trustedOrigins = new Set(
    (process.env.WEB_ORIGINS ?? "")
      .split(",")
      .map((value) => toOrigin(value.trim()))
      .filter((value): value is string => value !== null),
  );
  return trustedOrigins.has(toOrigin(origin) ?? "");
}

export async function verifyGoogleCredential(
  credential: string,
): Promise<GoogleIdentity> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new GoogleAuthNotConfiguredError();

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new InvalidGoogleCredentialError();
  }

  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new InvalidGoogleCredentialError();
  }

  return {
    googleSub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim() || payload.email.trim(),
  };
}
