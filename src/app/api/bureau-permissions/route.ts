import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bureau_menu_permissions')
      .select(`
        id,
        bureau_id,
        menu_id,
        can_view,
        can_create,
        can_edit,
        can_delete,
        bureau_groups(id, name),
        menu_items(id, menu_key, menu_name)
      `)
      .order('bureau_id', { ascending: true })
      .order('menu_id', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { bureau_id, menu_id, can_view } = await request.json();

    const { data, error } = await supabase
      .from('bureau_menu_permissions')
      .insert({ bureau_id, menu_id, can_view })
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, can_view, can_create, can_edit, can_delete } = await request.json();

    const updateData: any = {};
    if (can_view !== undefined) updateData.can_view = can_view;
    if (can_create !== undefined) updateData.can_create = can_create;
    if (can_edit !== undefined) updateData.can_edit = can_edit;
    if (can_delete !== undefined) updateData.can_delete = can_delete;

    const { data, error } = await supabase
      .from('bureau_menu_permissions')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const { error } = await supabase
      .from('bureau_menu_permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
