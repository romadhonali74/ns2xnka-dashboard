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
      .from("vessel_status")
      .select("status")
      .in("status", ["completed", "carry_over_to_next_month"])
      .like("month_year", `${year}-%`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = { completed: 0, carry_over_to_next_month: 0 };
    (data || []).forEach((row: { status: string }) => {
      if (counts[row.status] !== undefined) counts[row.status]++;
    });

    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
