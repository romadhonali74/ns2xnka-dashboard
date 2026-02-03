import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('manual_reports')
      .select('*')
      .order('id', { ascending: true });

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
      .from('manual_reports')
      .insert([{
        period_type: body.period_type,
        mka_plan: body.mka_plan,
        mka_actual: body.mka_actual,
        mka_percentage: body.mka_percentage,
        stn_plan: body.stn_plan,
        stn_actual: body.stn_actual,
        stn_percentage: body.stn_percentage,
        moronopo_plan: body.moronopo_plan,
        moronopo_actual: body.moronopo_actual,
        moronopo_percentage: body.moronopo_percentage
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('manual_reports')
      .update({
        period_type: body.period_type,
        mka_plan: body.mka_plan,
        mka_actual: body.mka_actual,
        mka_percentage: body.mka_percentage,
        stn_plan: body.stn_plan,
        stn_actual: body.stn_actual,
        stn_percentage: body.stn_percentage,
        moronopo_plan: body.moronopo_plan,
        moronopo_actual: body.moronopo_actual,
        moronopo_percentage: body.moronopo_percentage
      })
      .eq('id', id)
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
      .from('manual_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Manual report deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}