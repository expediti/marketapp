# Market My App — Supabase Database Architecture

This directory contains the production-grade PostgreSQL schema, Row Level Security (RLS) policies, storage bucket configurations, and seed data for the **Market My App** Indian influencer marketing marketplace.

---

## File Architecture

```text
supabase/
├── schema.sql                   # ⭐ SINGLE MASTER CONSOLIDATED BOOTSTRAP SCHEMA
├── migrations/                  # Migration history for Supabase CLI
│   ├── 001_extensions.sql       # uuid-ossp, pgcrypto
│   ├── 002_profiles.sql         # Base user profiles linked to auth.users (UUID based)
│   ├── 003_creator_profiles.sql # Verified creator/influencer metrics & categories
│   ├── 004_business_profiles.sql# Business & app advertiser profiles
│   ├── 005_creator_packages.sql # Collaboration rate cards & deliverables
│   ├── 006_orders.sql           # Orders (16 discrete states) & campaign briefs
│   ├── 007_order_events.sql     # Immutable state-machine audit log
│   ├── 008_payments.sql         # Inbound payments
│   ├── 009_payouts.sql          # Creator bank / UPI payouts
│   ├── 010_deliveries.sql       # Content submission and proofs
│   ├── 011_disputes.sql         # Delivery disputes and admin resolutions
│   ├── 012_messages.sql         # Order-specific chat with moderation
│   ├── 013_admin_actions.sql    # Administrative audit logging
│   ├── 014_rls.sql              # Granular Row Level Security policies
│   ├── 015_creator_reels.sql    # Creator portfolio reels with 19MB constraint
│   └── 016_storage.sql          # Supabase Storage bucket configurations & policies
├── seed/
│   └── development.sql          # Sample creator data for local testing
└── README.md
```

---

## Complete Database Bootstrap (`supabase/schema.sql`)

For any new Supabase project or production deployment, execute:
**`supabase/schema.sql`**

This single file contains the entire database schema in strict dependency order:
1. Extensions (`uuid-ossp`, `pgcrypto`)
2. Helper functions (`handle_updated_at`, `is_admin`, `handle_new_user`)
3. `profiles` table (UUID primary key mapped to `auth.users(id)`)
4. `creator_profiles` table (platform metrics, categories, Instagram metadata)
5. `business_profiles` table (app, website, and product advertiser metadata)
6. `creator_packages` table (standard pricing and deliverables)
7. `creator_reels` table (video metadata with strict 19 MB size constraint)
8. `orders` & `order_briefs` tables (discrete order, payment, and payout states)
9. `order_events` table (state machine transition audit trail)
10. `payments` and `payouts` tables
11. `deliveries` and `disputes` tables
12. `conversations` and `messages` tables
13. `admin_actions` table
14. Storage buckets (`creator-reels`, `creator-profiles`, `business-logos`)
15. Row Level Security (RLS) policies on all tables and storage objects

---

## Supabase Storage Buckets

1. **`creator-reels`**:
   - **Limit**: `19,922,944` bytes (19 MB)
   - **Allowed MIME types**: `video/mp4`, `video/webm`, `video/quicktime`
   - **Access**: Public read for visible reels; authenticated creators can upload/update/delete their own reels.

2. **`creator-profiles`**:
   - **Limit**: `5,242,880` bytes (5 MB)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

3. **`business-logos`**:
   - **Limit**: `5,242,880` bytes (5 MB)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`

---

## Applying with Supabase CLI

```bash
# Push migrations
npx supabase db push

# Or apply master schema directly
npx supabase db execute --file supabase/schema.sql

# Seed local development data
npx supabase db execute --file supabase/seed/development.sql
```
