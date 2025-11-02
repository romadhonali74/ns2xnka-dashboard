import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient as createServerClient } from '../../lib/supabase';

export async function GET() {
  const supabase = createServerClient();
  
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('produksi')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      break;
    }

    allData = [...allData, ...data];
    
    if (data.length < batchSize) {
      break;
    }
    
    from += batchSize;
  }

  return NextResponse.json(allData);
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();

  const { error } = await supabase
    .from('produksi')
    .insert([{
      ...body,
      created_at: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString()
    }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { id, ...updateData } = body;

  const { error } = await supabase
    .from('produksi')
    .update({
      ...updateData,
      edited_at: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString()
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabase
    .from('produksi')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}