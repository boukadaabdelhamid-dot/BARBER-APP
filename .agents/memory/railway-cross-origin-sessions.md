---
name: Cross-origin auth sessions
description: Session-cookie behavior when BarberLink web and API use separate Railway origins.
---

When production web and API services use separate origins, browser session cookies may need `SameSite=None; Secure`; keep an exact trusted-origin check on every state-changing endpoint that relies on those cookies. Keep a safe local-development fallback for HTTP.

**Why:** The deployed admin login endpoint returned success, but the browser did not proceed to authenticated admin data requests. Strict SameSite cookies can be withheld for cross-site API calls.

**How to apply:** For admin, barber, and customer sessions, verify cookie persistence from the actual production web origin to the API after deployment. CORS allowlisting alone is not a substitute for validating request origins on mutations.
