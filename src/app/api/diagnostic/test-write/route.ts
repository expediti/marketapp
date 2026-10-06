import { NextResponse } from 'next/server';
import { createServiceClient, isServiceRoleKeyAvailable } from '@/lib/supabase/server';
import { getServerRuntimeSecret } from '@/lib/server/razorpay';

export const dynamic = 'force-dynamic';

function extractProjectRef(url: string | undefined): string {
  if (!url) return 'undefined';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname; // e.g. "xyzabc.supabase.co"
    return host.split('.')[0] || host;
  } catch {
    return 'invalid_url';
  }
}

export async function GET(request: Request) {
  const TARGET_USER_ID = '62579897-01a3-4bf3-a8e7-7f4036494bf3';
  const TARGET_CREATOR_ID = '1be23a15-3db4-4d5b-a0b2-f51eb0880558';

  const rawUrl =
    getServerRuntimeSecret('NEXT_PUBLIC_SUPABASE_URL') ||
    getServerRuntimeSecret('SUPABASE_URL') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const projectRef = extractProjectRef(rawUrl);
  const serviceKeyPresent = isServiceRoleKeyAvailable();

  const serviceClient = createServiceClient();
  const nowIso = new Date().toISOString();

  // 1. Check existing row before update
  const { data: beforeRow, error: beforeError } = await serviceClient
    .from('creator_profiles')
    .select('id, user_id, updated_at, instagram_connected, instagram_username, follower_count, verification_status')
    .eq('id', TARGET_CREATOR_ID)
    .maybeSingle();

  // 2. Perform UPDATE on updated_at ONLY
  let updateSuccess = false;
  let updateErrorMsg: string | null = null;
  let updatedRowResult: any = null;

  try {
    const { data: updateData, error: updateErr } = await serviceClient
      .from('creator_profiles')
      .update({ updated_at: nowIso })
      .eq('id', TARGET_CREATOR_ID)
      .select('id, user_id, updated_at, instagram_connected, instagram_username, follower_count, verification_status');

    if (updateErr) {
      updateErrorMsg = updateErr.message;
    } else {
      updateSuccess = Boolean(updateData && updateData.length > 0);
      updatedRowResult = updateData?.[0] || null;
    }
  } catch (e: any) {
    updateErrorMsg = e.message || 'Exception during update';
  }

  // 3. Immediately SELECT row again
  const { data: afterRow, error: afterError } = await serviceClient
    .from('creator_profiles')
    .select('id, user_id, updated_at, instagram_connected, instagram_username, follower_count, verification_status')
    .eq('id', TARGET_CREATOR_ID)
    .maybeSingle();

  return NextResponse.json({
    diagnostic_version: 'db-test-2026-10-06-01',
    timestamp: nowIso,
    runtime_environment: {
      project_ref: projectRef,
      service_role_key_available: serviceKeyPresent,
    },
    target_identities: {
      target_user_id: TARGET_USER_ID,
      target_creator_id: TARGET_CREATOR_ID,
      row_found_before_update: Boolean(beforeRow),
      before_updated_at: beforeRow?.updated_at || null,
      before_error: beforeError?.message || null,
    },
    update_execution: {
      success: updateSuccess,
      affected_rows: updatedRowResult ? 1 : 0,
      updated_row: updatedRowResult,
      error: updateErrorMsg,
    },
    immediate_select_after_update: {
      selected_row: afterRow || null,
      after_updated_at: afterRow?.updated_at || null,
      error: afterError?.message || null,
    },
  });
}
