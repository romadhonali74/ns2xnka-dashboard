import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('mining_reports')
      .select('*')
      .eq('log_date', today)
      .order('company_id', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('mining_reports')
      .insert([{
        company_id: body.company_id,
        log_date: body.log_date,
        plan_wmt: body.plan_wmt,
        actual_wmt: body.actual_wmt
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('mining_reports')
      .update({
        company_id: body.company_id,
        log_date: body.log_date,
        plan_wmt: body.plan_wmt,
        actual_wmt: body.actual_wmt
      })
      .eq('id', body.id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('mining_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Mining report deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}