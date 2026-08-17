# 🎨 Styly Frontend (`client/`)

Welcome to the frontend codebase for **Styly** — the next-generation fashion discovery, creator outfit monetization, and multi-brand apparel e-commerce platform.

---

## 🌟 Overview & Architecture

The frontend is built as a single-page application (SPA) with **React 19**, **TypeScript**, and **Tailwind CSS**, bundled with **Vite**. It features complete dual experiences:
1. **Consumer & Creator Portal**: Live fashion feed, interactive mannequin builder, creator progression grades, garment tag discovery, multi-brand cart, and unified checkout.
2. **Brand Partner Dashboard**: Storefront management, product catalog uploads, and multi-brand dispatch fulfillment.
3. **Master Admin Console (`/admin`)**: Operational moderation suite with 5 quick-navigation hubs (Users, Posts, Orders, Analytics, Brands) and financial ledgers.

---

## 🛠️ Tech Stack & Key Libraries

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core UI component framework |
| **TypeScript** | Strict end-to-end type safety |
| **Vite** | Ultra-fast build tool & development server |
| **tRPC Client** | Type-safe RPC query and mutation client (`@trpc/client`, `@tanstack/react-query`) |
| **Wouter** | Lightweight, modern client-side routing |
| **Tailwind CSS v4** | Utility-first styling engine with customized design tokens |
| **Radix UI / Shadcn UI** | Accessible headless UI primitives (Dialogs, Dropdowns, Sheets, Tables, Tabs) |
| **Lucide React** | Consistent, modern icon set |
| **Recharts** | Interactive data visualization and financial trend charts |
| **Sonner** | Clean toast notifications system |

---

## 📂 Directory Structure

```
client/
├── public/                 # Static public assets (logos, mockups, default placeholders)
├── src/
│   ├── _core/              # Core authentication hooks & session management (`useAuth.ts`)
│   ├── components/         # Reusable UI components & layouts
│   │   ├── ui/             # Radix & Shadcn UI building blocks (Button, Card, Input, Dialog, etc.)
│   │   ├── AppShell.tsx    # Mobile-responsive consumer app shell with navigation bars
│   │   ├── DashboardLayout.tsx # Sidebar & master header for Admin Console
│   │   └── ...             # Modals, dialogs, filters, and badges
│   ├── contexts/           # React context providers (ThemeContext, LanguageContext)
│   ├── hooks/              # Custom React hooks (mobile detection, toast triggers)
│   ├── lib/                # tRPC client setup and utility helpers (`trpc.ts`, `utils.ts`)
│   ├── pages/              # Application views and page components
│   │   ├── Landing.tsx     # Landing page with 3D smartphone mockup & feature highlights
│   │   ├── HomeFeed.tsx    # Creator fashion outfit feed with tag interactions & shop links
│   │   ├── Explore.tsx     # Trending lookbook & discovery grid
│   │   ├── Shop.tsx        # Catalog browser with price & brand filtering
│   │   ├── Checkout.tsx    # Multi-brand unified order checkout (Card, D17, Flouci, COD)
│   │   ├── UserProfile.tsx # Creator grades, Style Points (XP), and delivery profile settings
│   │   ├── BrandDashboard.tsx # Brand partner store management & packaging fulfillment
│   │   ├── BrandStorefront.tsx # Public brand store page with verified catalog
│   │   ├── Overview.tsx    # Admin Executive Overview with 5 Core Quick-Nav Cards
│   │   ├── Users.tsx       # Admin user directory with creator grades & admin crown badges
│   │   ├── Products.tsx    # Admin post moderation with likes/shares/revenue metrics
│   │   ├── Orders.tsx      # Admin split order tracking, delivery approvals & refund actions
│   │   ├── Analytics.tsx   # Admin financial ledger (Gross Volume, Refunds, Net Gains)
│   │   ├── Brands.tsx      # Admin brand directory & store application approvals
│   │   └── Settings.tsx    # Root admin security settings & automation rules
│   ├── App.tsx             # Unified SPA router wiring all consumer, brand, and admin routes
│   └── main.tsx            # React application entry point with Providers
├── index.html              # Main HTML entry point
└── package.json            # Frontend dependency specifications
```

---

## 🚀 Key Features

* **Creator Progression System**: Users earn Style Points (XP) and unlock grades (`Newcomer` ➔ `Rising Stylist` ➔ `Trendsetter` ➔ `Fashion Icon`) with dynamic commission tiers.
* **Multi-Brand Unified Checkout**: Customers can purchase garments from multiple brands in a single transaction with automated per-brand order splitting.
* **Real-Time Moderation & Financial Tracking**: Root administrators have full oversight over all live outfits, user accounts, brand applications, and financial gain/loss metrics.

---

## 💻 Developer Scripts

```bash
# Run frontend in development mode
pnpm dev

# Check TypeScript typing across client
pnpm check

# Build production bundle
pnpm build
```
