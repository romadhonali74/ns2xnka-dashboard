import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { month, year, cat1, cat6, cat9, cat10, cat11, cat18, cat19, cat20, cat21, cat22, cat23, cat24, cat8, cat12, cat13, cat25, cat14, cat26 } = data;

    const toNumber = (val: any) => val === '' || val === null || val === undefined ? null : Number(val);

    // Fetch existing data
    const { data: existingSummary } = await supabase
      .from('finance_summary')
      .select('amount')
      .eq('item_name', 'Jumlah Hasil Penjualan')
      .eq('year', year)
      .eq('month', month)
      .single();

    const { data: existingMonthly } = await supabase
      .from('finance_monthly_data')
      .select('category_id, amount')
      .eq('year', year)
      .eq('month', month);

    // Update or insert finance_summary
    const cat1Value = toNumber(cat1) ?? existingSummary?.amount ?? 0;
    await supabase
      .from('finance_summary')
      .delete()
      .eq('item_name', 'Jumlah Hasil Penjualan')
      .eq('year', year)
      .eq('month', month);

    const { error: summaryError } = await supabase
      .from('finance_summary')
      .insert({ 
        item_name: 'Jumlah Hasil Penjualan', 
        amount: cat1Value, 
        year, 
        month 
      });

    if (summaryError) throw summaryError;

    // Prepare monthly data with existing values as fallback
    const getExistingAmount = (catId: number) => {
      const existing = existingMonthly?.find(item => item.category_id === catId);
      return existing?.amount ?? 0;
    };

    await supabase
      .from('finance_monthly_data')
      .delete()
      .eq('year', year)
      .eq('month', month);

    const monthlyDataInserts = [
      { category_id: 6, amount: toNumber(cat6) ?? getExistingAmount(6), year, month },
      { category_id: 9, amount: toNumber(cat9) ?? getExistingAmount(9), year, month },
      { category_id: 10, amount: toNumber(cat10) ?? getExistingAmount(10), year, month },
      { category_id: 11, amount: toNumber(cat11) ?? getExistingAmount(11), year, month },
      { category_id: 18, amount: toNumber(cat18) ?? getExistingAmount(18), year, month },
      { category_id: 19, amount: toNumber(cat19) ?? getExistingAmount(19), year, month },
      { category_id: 20, amount: toNumber(cat20) ?? getExistingAmount(20), year, month },
      { category_id: 21, amount: toNumber(cat21) ?? getExistingAmount(21), year, month },
      { category_id: 22, amount: toNumber(cat22) ?? getExistingAmount(22), year, month },
      { category_id: 23, amount: toNumber(cat23) ?? getExistingAmount(23), year, month },
      { category_id: 24, amount: toNumber(cat24) ?? getExistingAmount(24), year, month },
      { category_id: 8, amount: toNumber(cat8) ?? getExistingAmount(8), year, month },
      { category_id: 12, amount: toNumber(cat12) ?? getExistingAmount(12), year, month },
      { category_id: 13, amount: toNumber(cat13) ?? getExistingAmount(13), year, month },
      { category_id: 25, amount: toNumber(cat25) ?? getExistingAmount(25), year, month },
      { category_id: 14, amount: toNumber(cat14) ?? getExistingAmount(14), year, month },
      { category_id: 26, amount: toNumber(cat26) ?? getExistingAmount(26), year, month }
    ];

    const { error: monthlyError } = await supabase
      .from('finance_monthly_data')
      .insert(monthlyDataInserts);

    if (monthlyError) throw monthlyError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving financial data:', error);
    return NextResponse.json({ error: error.message || 'Failed to save data' }, { status: 500 });
  }
}
