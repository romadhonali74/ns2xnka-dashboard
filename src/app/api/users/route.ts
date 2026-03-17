import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    // Try to list users using admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Supabase admin error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = data.users.map(user => {
      // Log untuk debug

      return {
        id: user.id,
        email: user.email,
        raw_app_meta_data: user.app_metadata,
        raw_user_meta_data: user.user_metadata,
        is_super_admin: user.app_metadata?.is_super_admin || false,
        last_sign_in_at: user.last_sign_in_at
      };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, app_metadata, user_metadata, email_confirm } = await request.json();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm,
      app_metadata,
      user_metadata
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, app_metadata, user_metadata } = await request.json();

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata,
      user_metadata
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
