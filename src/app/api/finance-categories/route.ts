import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../lib/supabase';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch finance categories' },
      { status: 500 }
    );
  }
}