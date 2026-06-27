import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Verify caller is super_admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase.from('admins').select('role').eq('id', user.id).single();
  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 });
  }

  const { email, password, name, role } = await request.json();
  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Use service role key to create user without sign-in
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !newUser.user) {
    return NextResponse.json({ error: createErr?.message || 'User creation failed' }, { status: 400 });
  }

  // Insert into admins table
  const { error: insertErr } = await adminClient.from('admins').insert({
    id: newUser.user.id,
    name,
    email,
    role,
  });

  if (insertErr) {
    // Rollback user creation
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: newUser.user.id });
}
