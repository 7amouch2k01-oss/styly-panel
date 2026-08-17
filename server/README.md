# ⚙️ Styly Backend (`server/`)

Welcome to the backend server codebase for **Styly** — the high-performance API server powering authentication, multi-brand e-commerce orchestration, creator commission accounting, transactional emails, and admin operations.

---

## 🌟 Overview & Architecture

The backend is built with **Node.js**, **Express**, and **tRPC v11**, paired with **MongoDB / Mongoose** for persistent document storage and cloud data modeling. It provides end-to-end type safety directly with the client application without manual API contract synchronization.

---

## 🛠️ Tech Stack & Key Libraries

| Technology | Purpose |
| :--- | :--- |
| **Node.js & Express** | Core runtime environment and HTTP server framework |
| **TypeScript** | Strict type safety and compilation |
| **tRPC v11** | End-to-end typesafe RPC API layer with procedures and middleware |
| **MongoDB & Mongoose** | Primary database system with optimized schemas and indexing |
| **Zod** | Runtime input validation for all API routes and procedures |
| **Brevo REST API v3** | Transactional email dispatch (Password Resets, Order Confirmations) over HTTPS Port 443 |
| **BcryptJS** | Cryptographic password hashing and authentication salt routines |
| **SuperJSON** | Lossless data serialization (Dates, Maps, Sets) across client-server bridge |

---

## 📂 Directory Structure

```
server/
├── _core/                  # Internal server setup & environment configuration
│   ├── env.ts              # Environment variable parsing and validation
│   ├── trpc.ts             # tRPC initialization, context builders, and procedure gates (`publicProcedure`, `protectedProcedure`, `adminProcedure`)
│   └── vite.ts             # Express middleware serving production SPA and development Vite HMR
├── db.ts                   # Core database queries, CRUD operations, and multi-brand order splitter
├── email.ts                # Brevo REST API v3 transactional email delivery system
├── mongodb.ts              # Mongoose schema definitions (Users, Posts, Brands, Orders, Shipments, Commissions, Levels)
├── routers.ts              # Main tRPC API router assembling all sub-routers
└── storage.ts              # Object storage abstraction for garment photos and media
```

---

## 🔒 Security & Access Control

1. **Role-Based Procedure Access**:
   * `publicProcedure`: Open to all visitors (browsing feed, storefronts, catalog).
   * `protectedProcedure`: Requires a valid signed session cookie (user actions, ordering, liking).
   * `adminProcedure`: Strictly verifies `ctx.user.role === 'admin'` before allowing administrative actions (bans, approvals, financial stats).
2. **Safe Transactional Emails**:
   * Password reset tokens are generated with time-limited expirations (1 hour) and dispatched via Brevo HTTPS REST API to bypass SMTP port blocking.
3. **Password Security**:
   * All passwords are encrypted with multi-round Bcrypt hashing before storage in MongoDB.

---

## 📡 Core API Routers (`routers.ts`)

* **`auth`**: Register, Login, Logout, Session validation, Password Reset request & submission.
* **`users`**: Member listings, status updates (`active` / `inactive` / `banned`), role toggles (`user` / `admin`), and creator grade updates.
* **`posts`**: Creation, outfit tagging, liking, status updates (`active` / `hidden` / `flagged`), and deletion.
* **`devices`**: Catalog product inventory management for fashion brand items.
* **`orders`**: Full multi-brand order placement with automatic per-brand shipment splitting.
* **`delivery`**: Logistics lifecycle tracking (`pending` ➔ `preparing` ➔ `ready_for_pickup` ➔ `shipped` ➔ `delivered` / `refunded`).
* **`analytics`**: Live MongoDB aggregations for gross sales, creator commissions, customer refunds, and platform net revenue.
* **`brands`**: Brand creation, profile updates, activation toggles, and store application verification.

---

## 💻 Developer Scripts

```bash
# Run server in development mode (with hot reload)
pnpm dev

# Check TypeScript compiler
pnpm check

# Start production server
pnpm start:consumer
```
