# 🔗 Styly Shared Contracts (`shared/`)

This directory contains shared types, schema definitions, and constant values utilized across both the frontend (`client/`) and backend (`server/`) environments.

---

## 🌟 Purpose & Value

By keeping shared contracts in a central, single source of truth, **Styly** guarantees 100% type synchronicity between user interactions on the client and database operations on the server without code duplication.

---

## 📂 Contents

* **`schema.ts` / Data Models**:
  * Unified TypeScript interfaces for Users, Creator Grades, Brands, Outfits, Orders, Split Shipments, and Commissions.
  * Validation rules ensuring that fields like prices, stock, role enums, and delivery statuses match exact platform expectations.
* **`const.ts`**:
  * System-wide constants, currency defaults (`TND`), authentication error strings, and default pagination limits.

---

## 🛡️ Usage Example

```typescript
// Importing in server routers or client hooks
import { UNAUTHED_ERR_MSG } from "@shared/const";
```
