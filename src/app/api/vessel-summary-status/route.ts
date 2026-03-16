import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
})();

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const year = new URL(request.url).searchParams.get("year");
  if (!year) return NextResponse.json({ error: "year required" }, { status: 400 });

  const { data, error } = await supabase
    .from("vessel_summary_by_status")
    .select("month_year, status, buyer, jumlah_kapal")
    .like("month_year", `${year}-%`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
