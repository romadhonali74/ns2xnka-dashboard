import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("realisasi_summary")
      .select("period, remarks, plan_value, realisasi_progress, percentage");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
