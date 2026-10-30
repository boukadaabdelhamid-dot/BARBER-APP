---
name: Vite public environment values
description: How to expose one safe shared environment value to the BarberLink Vite browser app.
---

For a browser-visible value stored as a shared environment variable, Vite's default `VITE_` prefix does not expose a differently named variable. In this workspace, `define` aliases were left unchanged in the transformed development module, even though the API server received the value.

**Why:** Google sign-in appeared configured to the API but stayed unavailable in the preview because the client ID was absent from the browser module.

**How to apply:** For a public value such as `GOOGLE_CLIENT_ID`, allow only that prefix with Vite `envPrefix` and read `import.meta.env.GOOGLE_CLIENT_ID`. Verify the transformed dev module contains a non-empty value without printing it. Never expose unrelated environment variables or secrets.
