-- ============================================================================
-- 025_fix_collaboration_requests_status_check.sql
-- Fixes check constraint on collaboration_requests to allow 'REQUESTED'
-- ============================================================================

-- 1. Safely alter column default to canonical initial state 'REQUESTED'
ALTER TABLE public.collaboration_requests 
  ALTER COLUMN status SET DEFAULT 'REQUESTED';

-- 2. Drop the stale check constraint
ALTER TABLE public.collaboration_requests 
  DROP CONSTRAINT IF EXISTS collaboration_requests_status_check;

-- 3. Add canonical check constraint supporting all workflow states
ALTER TABLE public.collaboration_requests 
  ADD CONSTRAINT collaboration_requests_status_check 
  CHECK (status IN (
    'REQUESTED',
    'PENDING',
    'ACCEPTED',
    'NEGOTIATING',
    'DEAL_CONFIRMED',
    'DECLINED',
    'CANCELLED',
    'ENDED',
    'EXPIRED'
  ));

-- 4. Migrate any existing legacy 'PENDING' rows to 'REQUESTED'
UPDATE public.collaboration_requests 
SET status = 'REQUESTED' 
WHERE status = 'PENDING';

-- 5. Update notification trigger to handle REQUESTED and PENDING when accepted
CREATE OR REPLACE FUNCTION public.handle_collab_request_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_creator_name TEXT;
BEGIN
    IF (OLD.status IN ('REQUESTED', 'PENDING')) AND (NEW.status IN ('ACCEPTED', 'NEGOTIATING')) THEN
        SELECT COALESCE(display_name, 'Creator')
        INTO v_creator_name
        FROM public.profiles
        WHERE id = NEW.creator_user_id;

        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body
        ) VALUES (
            NEW.business_user_id,
            'REQUEST_ACCEPTED',
            'Collaboration Request Accepted!',
            v_creator_name || ' accepted your request. Private chat is now open to finalize details.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
