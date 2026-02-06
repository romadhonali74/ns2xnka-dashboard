import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not available" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json({ error: "Year parameter is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("daily_operations_summary")
      .select("tahun, bulan, total_target")
      .eq("tahun", parseInt(year));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
