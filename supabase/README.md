# Marketur Supabase Database Architecture

This directory contains the production-grade PostgreSQL schema migrations, Row Level Security (RLS) policies, and development seed data for the Marketur marketplace platform.

## Directory Structure

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

## How to Apply Migrations on a Fresh Supabase Project

### Option 1: Supabase CLI (Recommended)
```bash
supabase db push
# or
supabase migration up
```

### Option 2: Supabase Web Dashboard SQL Editor
Run the migration files in ascending order from `001_extensions.sql` through `014_rls.sql`.

## Seeding Development Data

To populate fictional Indian creators (Creator 042, Creator 018, etc.), sample businesses, packages, active orders, and chat threads:
```bash
# In the Supabase SQL editor or via psql:
\i supabase/seed/development.sql
```

## Purging / Resetting Development Data

To cleanly wipe all development data without dropping tables:
```sql
TRUNCATE public.messages, public.conversations, public.disputes,
         public.deliveries, public.payouts, public.payments,
         public.order_events, public.order_briefs, public.orders,
         public.creator_packages, public.creator_samples,
         public.business_profiles, public.creator_profiles,
         public.admin_actions, public.profiles CASCADE;
```

## Security & Row Level Security (RLS) Guarantee

1. **Creator Privacy**: No creator's bank details or payouts are visible to businesses. Creator Instagram handles are never exposed publicly (only anonymized IDs like `Creator 042` and verified analytics).
2. **Order Isolation**: Businesses and creators can only view orders and conversations they are participants in.
3. **Escrow Integrity**: Payment and payout records are strictly managed and viewable only by authorized parties and admins.
