import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bureau = searchParams.get('bureau');

  if (!bureau) {
    return NextResponse.json({ error: 'Bureau parameter required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('bureau_menu_permissions')
      .select(`
        menu_id,
        can_view,
        can_create,
        can_edit,
        can_delete,
        bureau_groups!inner(name),
        menu_items!inner(menu_key)
      `)
      .eq('bureau_groups.name', bureau)
      .eq('can_view', true);

    if (error) throw error;

    const menuKeys = data?.map((p: any) => {
      return Array.isArray(p.menu_items) ? p.menu_items[0]?.menu_key : p.menu_items?.menu_key;
    }) || [];

    const crudPermissions: Record<string, { canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
    data?.forEach((p: any) => {
      const menuKey = Array.isArray(p.menu_items) ? p.menu_items[0]?.menu_key : p.menu_items?.menu_key;
      if (menuKey) {
        crudPermissions[menuKey] = {
          canCreate: p.can_create || false,
          canEdit: p.can_edit || false,
          canDelete: p.can_delete || false,
        };
      }
    });
    
    return NextResponse.json({ menuKeys, crudPermissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
