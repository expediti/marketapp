# Marketur — India Creator ↔ Business Collaboration Marketplace

> A modern, minimal, slightly retro collaboration marketplace built for Indian Instagram creators, D2C brands, local businesses, and marketing agencies.

---

## 1. Visual Identity & Aesthetic

* **Palette**: Restrained International Orange (`#FF5416`), Warm Off-white (`#FBFBFA`, `#F4F3EE`), Slate / Charcoal (`#121214`, `#18181B`, `#27272A`), Crisp Subtle Borders (`#E5E5DE`).
* **Typography**: Editorial Display headings (Space Grotesk), clean readable body (Plus Jakarta Sans), and monospace tabular statistics (JetBrains Mono).
* **Guarantees**: No AI buzzword gradients, no generic dashboard templates, no public Instagram handles exposed.

---

## 2. Key Marketplace Capabilities

1. **Creator Anonymity & Verified Metrics**:
   - Instagram handles are strictly private and never exposed publicly.
   - Profiles are listed as `Creator 042`, `Creator 018`, etc.
   - Direct API-verified follower counts, reach, engagement rates, and demographic breakdowns (City, Age, Gender).
2. **Fixed Collaboration Packages (Rate Cards)**:
   - Transparent rates for 1 Reel, 3 Stories, Reel + Stories, or Custom Packages with turnaround time and revision count.
3. **Escrow Protection**:
   - Businesses pre-fund orders before production begins.
   - Funds are held in escrow and released to creator bank accounts via UPI only upon delivery approval.
4. **Order Lifecycle State Machine**:
   - 16 discrete states: `DRAFT` → `PAYMENT_PENDING` → `FUNDED` → `CREATOR_PENDING` → `ACCEPTED` → `IN_PROGRESS` → `DELIVERED` → `APPROVED` → `COMPLETED` (or `DISPUTED` → `ADMIN_REVIEW` → `REFUNDED` / `PAID`).
   - Logged in immutable `order_events` table.
5. **Order-Specific Chat with Contact-Info Moderation**:
   - Every conversation is anchored to an order.
   - Real-time detection flags off-platform phone numbers, emails, Instagram handles, and external payment links.
6. **Dispute System & Admin Operations Portal**:
   - Business can dispute deliverables that violate the campaign brief.
   - Admin panel with platform GMV, 5% revenue, dispute mediation, payout releases, creator verification, and audit logs.

---

## 3. Database Schema (Supabase / PostgreSQL)

Located in `/supabase/migrations/`:
```text
supabase/
├── migrations/
│   ├── 001_extensions.sql       # uuid-ossp, pgcrypto
│   ├── 002_profiles.sql         # Base user profiles linked to auth.users
│   ├── 003_creator_profiles.sql # Verified creator metrics & sample work
│   ├── 004_business_profiles.sql# Business and promoter entities
│   ├── 005_creator_packages.sql # Collaboration rate cards & deliverables
│   ├── 006_orders.sql           # Orders & detailed campaign briefs
│   ├── 007_order_events.sql     # Immutable state-machine audit log
│   ├── 008_payments.sql         # Escrow payments
│   ├── 009_payouts.sql          # Creator bank / UPI payouts
│   ├── 010_deliveries.sql       # Content submission and proofs
│   ├── 011_disputes.sql         # Delivery disputes and admin resolutions
│   ├── 012_messages.sql         # Order-specific chat with moderation
│   ├── 013_admin_actions.sql    # Administrative audit logging
│   └── 014_rls.sql              # Granular Row Level Security policies
├── seed/
│   └── development.sql          # Fictional seed data for development
└── README.md
```

### Resetting / Purging Seed Data
To purge development records cleanly in PostgreSQL:
```sql
TRUNCATE public.messages, public.conversations, public.disputes,
         public.deliveries, public.payouts, public.payments,
         public.order_events, public.order_briefs, public.orders,
         public.creator_packages, public.creator_samples,
         public.business_profiles, public.creator_profiles,
         public.admin_actions, public.profiles CASCADE;
```

---

## 4. Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase URL and Anon Key when connecting to a remote Supabase project.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 5. Reviewer / Dev Persona Switcher

When running the application, a top notification bar enables 1-click persona switching:
* **Business**: Test discovery, package checkout, campaign briefs, delivery approval, and disputes.
* **Creator 042**: Test inbound collaboration requests, order acceptance, content proof submission, and earnings.
* **Admin**: Test platform GMV oversight, escrow releases, and dispute resolutions.
