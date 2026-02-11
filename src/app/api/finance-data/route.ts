import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { month, year, cat1, cat6, cat3, cat9, cat10, cat11, cat18, cat19, cat20, cat21, cat22, cat23, cat24, cat8, cat12, cat13, cat25, cat14, cat26 } = data;

    // Insert to finance_summary
    const { error: summaryError } = await supabase
      .from('finance_summary')
      .insert({ id: 1, item_name: 'Jumlah Hasil Penjualan', amount: cat1, year, month });

    if (summaryError) throw summaryError;

    // Insert to finance_monthly_data
    const monthlyDataInserts = [
      { category_id: 6, amount: cat6, year, month },
      { category_id: 3, amount: cat3, year, month },
      { category_id: 9, amount: cat9, year, month },
      { category_id: 10, amount: cat10, year, month },
      { category_id: 11, amount: cat11, year, month },
      { category_id: 18, amount: cat18, year, month },
      { category_id: 19, amount: cat19, year, month },
      { category_id: 20, amount: cat20, year, month },
      { category_id: 21, amount: cat21, year, month },
      { category_id: 22, amount: cat22, year, month },
      { category_id: 23, amount: cat23, year, month },
      { category_id: 24, amount: cat24, year, month },
      { category_id: 8, amount: cat8, year, month },
      { category_id: 12, amount: cat12, year, month },
      { category_id: 13, amount: cat13, year, month },
      { category_id: 25, amount: cat25, year, month },
      { category_id: 14, amount: cat14, year, month },
      { category_id: 26, amount: cat26, year, month }
    ];

    const { error: monthlyError } = await supabase
      .from('finance_monthly_data')
      .insert(monthlyDataInserts);

    if (monthlyError) throw monthlyError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving financial data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
