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
        menu_items!inner(menu_key)
      `)
      .eq('bureau_groups.name', bureau)
      .eq('can_view', true);

    if (error) throw error;

    // const menuKeys = data.map(p => p.menu_items.menu_key);
    // Tambahkan pengecekan atau casting 'any' biar TypeScript gak protes
    const menuKeys = data.map((p: any) => {
      // Karena p.menu_items bisa dianggap array oleh TS, kita ambil index ke-0 
      // atau akses langsung jika TS sudah tenang
      return Array.isArray(p.menu_items) ? p.menu_items[0]?.menu_key : p.menu_items?.menu_key;
    });
    return NextResponse.json(menuKeys);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
