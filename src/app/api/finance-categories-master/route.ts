import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('finance_categories_master')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching finance categories master:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}