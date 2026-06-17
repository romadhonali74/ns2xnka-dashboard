import { createClient } from '@supabase/supabase-js'
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase";

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Fetch all data
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('test_table')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST - Create new data
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('test_table')
      .insert([body])
      .select()

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT - Update data
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase
      .from('test_table')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE - Delete data
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    const { error } = await supabase
      .from('test_table')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ message: 'Data deleted successfully' })
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}