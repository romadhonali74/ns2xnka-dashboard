import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient as createServerClient } from '../../lib/supabase';

export async function GET() {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('product_sum')
    .select('*');

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();

  const { error } = await supabase
    .from('product_sum')
    .insert([body]);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { id, ...updateData } = body;

  const { error } = await supabase
    .from('product_sum')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = await supabase
    .from('product_sum')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}