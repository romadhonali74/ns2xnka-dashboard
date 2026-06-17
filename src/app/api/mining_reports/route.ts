import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = supabase.from('mining_reports').select('*');
    
    if (startDate && endDate) {
      // Date range query for MTD/YTD calculations
      query = query.gte('log_date', startDate).lte('log_date', endDate);
    } else if (filterDate) {
      // Single date query
      query = query.eq('log_date', filterDate);
    } else {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('log_date', today);
    }
    
    const { data, error } = await query.order('company_id', { ascending: true });

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
    
    // Check if this is manual report data (has period_type)
    if (body.period_type) {
      const { data, error } = await supabase
        .from('mining_reports')
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
        console.error('Insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Data created successfully', data: data[0] });
    }
    
    // Check if this is an UPSERT request
    if (body.upsert) {
      // First, check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('mining_reports')
        .select('id')
        .eq('company_id', body.company_id)
        .eq('log_date', body.log_date)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Check error:', checkError);
        return NextResponse.json({ error: checkError.message }, { status: 500 });
      }

      if (existingData) {
        // Record exists, update it
        const { data, error } = await supabase
          .from('mining_reports')
          .update({
            plan_wmt: body.plan_wmt,
            actual_wmt: body.actual_wmt
          })
          .eq('id', existingData.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Data updated successfully', data: data[0] });
      } else {
        // Record doesn't exist, insert new one
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
          console.error('Insert error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Data created successfully', data: data[0] });
      }
    } else {
      // Regular POST - insert new record
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
    }
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
    
    // Check if this is manual report data (has period_type)
    if (body.period_type && id) {
      const { data, error } = await supabase
        .from('mining_reports')
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
        console.error('Update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Data updated successfully', data: data[0] });
    }
    
    // Support UPSERT logic for PUT as well
    if (body.upsert) {
      // First, check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('mining_reports')
        .select('id')
        .eq('company_id', body.company_id)
        .eq('log_date', body.log_date)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check error:', checkError);
        return NextResponse.json({ error: checkError.message }, { status: 500 });
      }

      if (existingData) {
        // Record exists, update it
        const { data, error } = await supabase
          .from('mining_reports')
          .update({
            plan_wmt: body.plan_wmt,
            actual_wmt: body.actual_wmt
          })
          .eq('id', existingData.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Data updated successfully', data: data[0] });
      } else {
        // Record doesn't exist, insert new one
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
          console.error('Insert error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Data created successfully', data: data[0] });
      }
    } else {
      // Regular PUT - update by ID
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
    }
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