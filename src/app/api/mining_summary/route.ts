import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const companyId = searchParams.get('company_id');

    let query = supabase.from('dashboard_mining_summary').select('*');

    if (year) {
      query = query.eq('tahun', parseInt(year));
    }
    if (month) {
      query = query.eq('bulan', parseInt(month));
    }
    if (companyId) {
      query = query.eq('company_id', parseInt(companyId));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching mining summary:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
