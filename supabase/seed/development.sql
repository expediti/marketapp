-- ============================================================================
-- DEVELOPMENT SEED DATA
-- Fictional realistic creator profiles, businesses, packages, and collaboration orders.
--
-- TO CLEAN/PURGE ALL SEED DATA:
-- TRUNCATE public.messages, public.conversations, public.disputes,
--          public.deliveries, public.payouts, public.payments,
--          public.order_events, public.order_briefs, public.orders,
--          public.creator_packages, public.creator_samples,
--          public.business_profiles, public.creator_profiles,
--          public.admin_actions, public.profiles CASCADE;
-- ============================================================================

-- 1. PROFILES (Fixed UUIDs for consistent seed reference)
INSERT INTO public.profiles (id, role, display_name, email, avatar_url, city)
VALUES
    ('c0000000-0000-0000-0000-000000000042', 'creator', 'Creator 042', 'creator042@marketur.local', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', 'Varanasi'),
    ('c0000000-0000-0000-0000-000000000018', 'creator', 'Creator 018', 'creator018@marketur.local', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', 'Bengaluru'),
    ('c0000000-0000-0000-0000-000000000007', 'creator', 'Creator 007', 'creator007@marketur.local', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', 'Mumbai'),
    ('c0000000-0000-0000-0000-000000000089', 'creator', 'Creator 089', 'creator089@marketur.local', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80', 'Jaipur'),
    ('c0000000-0000-0000-0000-000000000112', 'creator', 'Creator 112', 'creator112@marketur.local', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', 'Delhi NCR'),
    ('c0000000-0000-0000-0000-000000000023', 'creator', 'Creator 023', 'creator023@marketur.local', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80', 'Kochi'),
    ('b0000000-0000-0000-0000-000000000001', 'business', 'Kashi Craft Coffee', 'collaborate@kashicraft.in', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80', 'Varanasi'),
    ('b0000000-0000-0000-0000-000000000002', 'business', 'Sutra Organics', 'partners@sutraorganics.com', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80', 'Bengaluru'),
    ('b0000000-0000-0000-0000-000000000003', 'business', 'Urban Loom India', 'marketing@urbanloom.in', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80', 'Jaipur'),
    ('a0000000-0000-0000-0000-000000000001', 'admin', 'Marketur Lead Admin', 'ops@marketur.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80', 'Bengaluru')
ON CONFLICT (id) DO NOTHING;

-- 2. CREATOR PROFILES (Verified metrics originating from simulated connected account)
INSERT INTO public.creator_profiles (
    user_id, niche, bio, instagram_connected, instagram_verified,
    follower_count, average_reach, engagement_rate,
    audience_gender, audience_age, audience_locations, verification_status
)
VALUES
    (
        'c0000000-0000-0000-0000-000000000042',
        'Food • Lifestyle',
        'Exploring heritage culinary trails, artisanal cafes, and sustainable slow living across Uttar Pradesh & North India.',
        true, true,
        18400, 36200, 4.80,
        '{"female": 62, "male": 38}'::jsonb,
        '{"18-24": 51, "25-34": 37, "35+": 12}'::jsonb,
        '[{"city": "Varanasi", "percentage": 34}, {"city": "Lucknow", "percentage": 22}, {"city": "Delhi NCR", "percentage": 18}, {"city": "Prayagraj", "percentage": 11}]'::jsonb,
        'verified'
    ),
    (
        'c0000000-0000-0000-0000-000000000018',
        'Tech • Productivity',
        'Software developer and tech curator reviewing minimalist desk setups, Indian developer tools, and smart gear.',
        true, true,
        42100, 78500, 5.20,
        '{"female": 28, "male": 72}'::jsonb,
        '{"18-24": 38, "25-34": 52, "35+": 10}'::jsonb,
        '[{"city": "Bengaluru", "percentage": 42}, {"city": "Hyderabad", "percentage": 24}, {"city": "Pune", "percentage": 15}]'::jsonb,
        'verified'
    ),
    (
        'c0000000-0000-0000-0000-000000000007',
        'Fashion • Editorial',
        'Contemporary Indian handloom styling, vintage thrift finds, and modern streetwear aesthetic with raw visual direction.',
        true, true,
        64800, 112000, 3.90,
        '{"female": 74, "male": 26}'::jsonb,
        '{"18-24": 46, "25-34": 44, "35+": 10}'::jsonb,
        '[{"city": "Mumbai", "percentage": 48}, {"city": "Delhi NCR", "percentage": 26}, {"city": "Bengaluru", "percentage": 14}]'::jsonb,
        'verified'
    ),
    (
        'c0000000-0000-0000-0000-000000000089',
        'Design • Architecture',
        'Documenting Haveli restorations, block printing workshops, and desert aesthetics across Rajasthan and Gujarat.',
        true, true,
        29300, 48000, 4.10,
        '{"female": 58, "male": 42}'::jsonb,
        '{"18-24": 32, "25-34": 54, "35+": 14}'::jsonb,
        '[{"city": "Jaipur", "percentage": 39}, {"city": "Delhi NCR", "percentage": 28}, {"city": "Ahmedabad", "percentage": 18}]'::jsonb,
        'verified'
    ),
    (
        'c0000000-0000-0000-0000-000000000112',
        'Fitness • Calisthenics',
        'Functional movement, daily discipline, and clean vegetarian nutrition for high-energy urban professionals.',
        true, true,
        51200, 89400, 6.10,
        '{"female": 44, "male": 56}'::jsonb,
        '{"18-24": 54, "25-34": 38, "35+": 8}'::jsonb,
        '[{"city": "Delhi NCR", "percentage": 52}, {"city": "Chandigarh", "percentage": 22}, {"city": "Jaipur", "percentage": 12}]'::jsonb,
        'verified'
    ),
    (
        'c0000000-0000-0000-0000-000000000023',
        'Travel • Coastal Living',
        'Unexplored backwaters, spice farm foraging, and slow travel diaries across Kerala and the Western Ghats.',
        true, true,
        22900, 41000, 4.40,
        '{"female": 52, "male": 48}'::jsonb,
        '{"18-24": 41, "25-34": 49, "35+": 10}'::jsonb,
        '[{"city": "Kochi", "percentage": 44}, {"city": "Bengaluru", "percentage": 28}, {"city": "Chennai", "percentage": 16}]'::jsonb,
        'verified'
    )
ON CONFLICT (user_id) DO NOTHING;

-- 3. BUSINESS PROFILES
INSERT INTO public.business_profiles (user_id, business_name, industry, city, website, description, verification_status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Kashi Craft Coffee', 'Food & Beverage', 'Varanasi', 'https://kashicraftcoffee.in', 'Specialty micro-roastery sourcing shade-grown Arabica from Araku and Chikmagalur with an open tasting room in Varanasi.', 'verified'),
    ('b0000000-0000-0000-0000-000000000002', 'Sutra Organics', 'Wellness & Skincare', 'Bengaluru', 'https://sutraorganics.com', 'Clean botanical skincare formulated with cold-pressed Ayurvedic botanicals in recyclable glass packaging.', 'verified'),
    ('b0000000-0000-0000-0000-000000000003', 'Urban Loom India', 'D2C Apparel', 'Jaipur', 'https://urbanloom.in', 'Modern silhouettes crafted from naturally-dyed Bagru and Ajrakh handloom cotton fabrics.', 'verified')
ON CONFLICT (user_id) DO NOTHING;

-- 4. CREATOR PACKAGES
INSERT INTO public.creator_packages (id, creator_id, name, description, price, delivery_days, revision_count, active)
VALUES
    -- Creator 042 Packages
    ('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000042', '1 Reel', 'High-production 30-45s vertical video featuring on-location tasting, storytelling narration, and pinned comment.', 2500.00, 5, 1, true),
    ('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000042', '3 Stories', 'Three sequential vertical stories with interactive poll sticker, direct product tagging, and swipe link.', 1200.00, 3, 1, true),
    ('p0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000042', 'Reel + Stories', 'Complete campaign: 1 high-impact hero Reel supported by 3 behind-the-scenes promotional Stories on release day.', 3200.00, 5, 2, true),

    -- Creator 018 Packages
    ('p0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000018', 'Dedicated Reel / Review', 'Comprehensive unboxing, practical workflow demo, and authentic impressions for tech enthusiasts.', 6000.00, 7, 1, true),
    ('p0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000018', 'Story Series (5 frames)', 'Deep-dive walkthrough with direct links and promo code highlights.', 2800.00, 4, 1, true),

    -- Creator 007 Packages
    ('p0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', 'Editorial Lookbook Reel', 'Fashion editorial reel filmed on prime lenses with curated styling and color grading.', 8500.00, 6, 2, true),
    ('p0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'Collaborative Post + 2 Stories', 'Permanent carousel post with detailed caption tags plus 2 launch-day teaser stories.', 7000.00, 5, 1, true),

    -- Creator 089 Packages
    ('p0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000089', 'Architectural Reel', 'Storytelling reel focused on craft, materials, and spatial aesthetics.', 4000.00, 5, 1, true),

    -- Creator 112 Packages
    ('p0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000112', 'Workout Integration Reel', 'Seamless product integration into a high-intensity routine with form breakdown.', 5500.00, 4, 1, true),

    -- Creator 023 Packages
    ('p0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000023', 'Travel Experience Reel', 'Cinematic travel vignette featuring your brand or stay in lush South Indian landscapes.', 3800.00, 6, 1, true)
ON CONFLICT (id) DO NOTHING;

-- 5. CREATOR SAMPLE WORK (Watermarked placeholders, internal assets)
INSERT INTO public.creator_samples (creator_id, image_url, title, description, sort_order)
VALUES
    ('c0000000-0000-0000-0000-000000000042', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', 'Artisanal Breakfast Showcase', 'Morning brew series at old city cafes with organic lighting.', 1),
    ('c0000000-0000-0000-0000-000000000042', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', 'Heritage Street Spice Tasting', 'Documentary style reel exploring century-old spice traders.', 2),
    ('c0000000-0000-0000-0000-000000000042', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', 'Regional Thali Pairing', 'Collaborative dining guide with local gourmet restaurant.', 3),
    ('c0000000-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80', 'Minimal Desk Setup 2026', 'Ergonomic workspace product placement featuring mechanical keyboard.', 1),
    ('c0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80', 'Khadi In Monsoon', 'Monochrome and rust styling editorial captured in South Mumbai.', 1)
ON CONFLICT (id) DO NOTHING;

-- 6. ORDERS & STATE MACHINE EXAMPLES
-- Order #10482: Creator 042 + Kashi Craft Coffee (Status: DELIVERED -> Ready for Business Approval)
INSERT INTO public.orders (
    id, order_number, business_id, creator_id, package_id,
    order_status, payment_status, payout_status,
    subtotal, platform_fee, total_amount, deadline
)
VALUES (
    'o0000000-0000-0000-0000-0000000010482',
    'ORD-10482',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000042',
    'p0000000-0000-0000-0000-000000000001',
    'DELIVERED',
    'FUNDED',
    'UNRELEASED',
    2500.00,
    125.00,
    2625.00,
    timezone('utc'::text, now() + interval '3 days')
)
ON CONFLICT (id) DO NOTHING;

-- Order #10480: Creator 018 + Sutra Organics (Status: COMPLETED / PAID)
INSERT INTO public.orders (
    id, order_number, business_id, creator_id, package_id,
    order_status, payment_status, payout_status,
    subtotal, platform_fee, total_amount, deadline
)
VALUES (
    'o0000000-0000-0000-0000-0000000010480',
    'ORD-10480',
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000018',
    'p0000000-0000-0000-0000-000000000004',
    'COMPLETED',
    'FUNDED',
    'PAID',
    6000.00,
    300.00,
    6300.00,
    timezone('utc'::text, now() - interval '5 days')
)
ON CONFLICT (id) DO NOTHING;

-- Order #10491: Creator 007 + Urban Loom India (Status: DISPUTED -> Under Admin Review)
INSERT INTO public.orders (
    id, order_number, business_id, creator_id, package_id,
    order_status, payment_status, payout_status,
    subtotal, platform_fee, total_amount, deadline
)
VALUES (
    'o0000000-0000-0000-0000-0000000010491',
    'ORD-10491',
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000007',
    'p0000000-0000-0000-0000-000000000006',
    'DISPUTED',
    'FUNDED',
    'HELD',
    8500.00,
    425.00,
    8925.00,
    timezone('utc'::text, now() + interval '1 day')
)
ON CONFLICT (id) DO NOTHING;

-- 7. ORDER BRIEFS
INSERT INTO public.order_briefs (order_id, objective, requirements, dos, donts, deadline, additional_notes)
VALUES
    (
        'o0000000-0000-0000-0000-0000000010482',
        'Launch of Monsoon Pour-Over blend with tasting notes of wild honey and roasted chicory.',
        'Create a warm, atmospheric reel showcasing the pour-over brewing ritual using Kashi Craft whole beans. Focus on aroma, pour speed, and morning light.',
        'Do highlight the bean origin (Araku Valley). Do show the packaging front label clearly in natural light. Do include a question sticker on story.',
        'Don''t add artificial voiceover filters or robotic music. Don''t compare directly with commercial instant coffees.',
        timezone('utc'::text, now() + interval '3 days'),
        'Beans sample packet has been delivered via Bluedart tracking #BLU8921829.'
    ),
    (
        'o0000000-0000-0000-0000-0000000010491',
        'Indigo Dabu Shirt Summer Campaign.',
        'Editorial reel showcasing hand-block printed indigo textures and styling advice for work and evening wear.',
        'Focus on the artisanal wooden block printing heritage and breathability.',
        'Don''t shoot in low light or club settings.',
        timezone('utc'::text, now() + interval '1 day'),
        'Sample apparel size Medium provided.'
    )
ON CONFLICT (order_id) DO NOTHING;

-- 8. ORDER EVENTS AUDIT LOG
INSERT INTO public.order_events (order_id, from_status, to_status, actor_id, reason, metadata)
VALUES
    ('o0000000-0000-0000-0000-0000000010482', 'DRAFT', 'FUNDED', 'b0000000-0000-0000-0000-000000000001', 'Order created and escrow funded via Escrow Vault', '{"amount": 2625.00}'::jsonb),
    ('o0000000-0000-0000-0000-0000000010482', 'FUNDED', 'ACCEPTED', 'c0000000-0000-0000-0000-000000000042', 'Creator accepted campaign brief and confirmed timeline', '{}'::jsonb),
    ('o0000000-0000-0000-0000-0000000010482', 'ACCEPTED', 'IN_PROGRESS', 'c0000000-0000-0000-0000-000000000042', 'Filming on location at Assi Ghat cafe', '{}'::jsonb),
    ('o0000000-0000-0000-0000-0000000010482', 'IN_PROGRESS', 'DELIVERED', 'c0000000-0000-0000-0000-000000000042', 'Draft Reel uploaded for review with live draft preview link', '{"video_duration_sec": 38}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 9. PAYMENTS IN ESCROW
INSERT INTO public.payments (order_id, provider, provider_payment_id, amount, currency, status, metadata)
VALUES
    ('o0000000-0000-0000-0000-0000000010482', 'escrow_service', 'pay_mock_10482_kashi', 2625.00, 'INR', 'captured', '{"gateway": "razorpay_mock", "method": "upi"}'::jsonb),
    ('o0000000-0000-0000-0000-0000000010480', 'escrow_service', 'pay_mock_10480_sutra', 6300.00, 'INR', 'captured', '{"gateway": "razorpay_mock", "method": "netbanking"}'::jsonb),
    ('o0000000-0000-0000-0000-0000000010491', 'escrow_service', 'pay_mock_10491_urban', 8925.00, 'INR', 'captured', '{"gateway": "razorpay_mock", "method": "card"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 10. DELIVERIES
INSERT INTO public.deliveries (id, order_id, submitted_by, proof_url, notes, status)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'o0000000-0000-0000-0000-0000000010482',
        'c0000000-0000-0000-0000-000000000042',
        'https://marketur.preview/assets/proof-reel-10482.mp4',
        'Final edit complete! Added natural dawn audio, featured the Araku origin card at 0:14, and styled in the terracotta cup as requested.',
        'pending_review'
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'o0000000-0000-0000-0000-0000000010491',
        'c0000000-0000-0000-0000-000000000007',
        'https://marketur.preview/assets/proof-reel-10491.mp4',
        'Draft video delivered for lookbook.',
        'disputed'
    )
ON CONFLICT (id) DO NOTHING;

-- 11. DISPUTES
INSERT INTO public.disputes (
    id, order_id, opened_by, reason, description, evidence_url, status
)
VALUES (
    'dsp00000-0000-0000-0000-000000000001',
    'o0000000-0000-0000-0000-0000000010491',
    'b0000000-0000-0000-0000-000000000003',
    'Didn''t follow brief',
    'The reel was shot indoors under neon lighting instead of natural daytime light, and the Dabu woodblock craft explanation was completely omitted from narration.',
    'https://marketur.preview/assets/dispute-evidence-10491.png',
    'open'
)
ON CONFLICT (id) DO NOTHING;

-- 12. CONVERSATIONS & MESSAGES (Order-specific chat)
INSERT INTO public.conversations (id, order_id)
VALUES
    ('cnv00000-0000-0000-0000-000000000482', 'o0000000-0000-0000-0000-0000000010482'),
    ('cnv00000-0000-0000-0000-000000000491', 'o0000000-0000-0000-0000-0000000010491')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (conversation_id, sender_id, body, moderation_status, created_at)
VALUES
    ('cnv00000-0000-0000-0000-000000000482', 'b0000000-0000-0000-0000-000000000001', 'Hi Creator 042! Thrilled to partner with you. We shipped fresh Araku roast samples to your studio address.', 'clean', timezone('utc'::text, now() - interval '2 days')),
    ('cnv00000-0000-0000-0000-000000000482', 'c0000000-0000-0000-0000-000000000042', 'Received them this morning! The aroma is incredible. I am planning a morning light brew sequence at 6:30 AM tomorrow.', 'clean', timezone('utc'::text, now() - interval '1 day')),
    ('cnv00000-0000-0000-0000-000000000482', 'b0000000-0000-0000-0000-000000000001', 'That sounds perfect. Make sure the pour-over cone and honey notes are highlighted in the hook.', 'clean', timezone('utc'::text, now() - interval '18 hours')),
    ('cnv00000-0000-0000-0000-000000000482', 'c0000000-0000-0000-0000-000000000042', 'Done! Just submitted the delivery draft in the workspace for your review. Let me know your thoughts.', 'clean', timezone('utc'::text, now() - interval '2 hours'))
ON CONFLICT (id) DO NOTHING;

-- 13. ADMIN ACTIONS
INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, metadata)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'VERIFY_CREATOR_METRICS', 'creator_profiles', 'c0000000-0000-0000-0000-000000000042', '{"instagram_status": "api_synced", "verified_at": "2026-09-20"}'::jsonb),
    ('a0000000-0000-0000-0000-000000000001', 'APPROVE_BUSINESS_KYC', 'business_profiles', 'b0000000-0000-0000-0000-000000000001', '{"gstin": "09AAACK1234F1Z5", "verified": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;
