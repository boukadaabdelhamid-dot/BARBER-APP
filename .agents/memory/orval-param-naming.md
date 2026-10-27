---
name: Orval parameter naming
description: Avoid generated-name collisions when an OpenAPI operation combines path and query parameters.
---

When an OpenAPI operation has both path and query parameters, Orval can emit a Zod `<OperationId>Params` schema and a TypeScript `<OperationId>Params` interface from different generated files. The shared barrel then fails with TS2308.

**Why:** This workspace exports both generated Zod schemas and generated parameter types with `export *`, so the same public name is ambiguous even though the files are separate.

**How to apply:** If an endpoint has no need for path semantics, consider placing the complete identifier set in query parameters on a parameterless route. Otherwise rename or restructure the contract to avoid the duplicate export, then run API codegen and the library typecheck.
