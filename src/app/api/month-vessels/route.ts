import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("monthYear"); // YYYY-MM
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json({ message: "Invalid 'monthYear' (YYYY-MM)" }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("month_vessels")
      .select("vessels ( vessel_name ), seq, created_at, display_order")
      .eq("month_year", monthYear)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("seq", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });
    const entries = (data || [])
      .map((r: any) => ({
        name: Array.isArray(r.vessels) ? r.vessels[0]?.vessel_name : r.vessels?.vessel_name,
        seq: r.seq as number,
        display_order: r.display_order as number | null,
      }))
      .filter((e) => !!e.name);
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { monthYear: string; vesselName: string; position?: number };
    const { monthYear, vesselName, position } = body;
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear) || !vesselName) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    let vesselId: string | null = null;
    {
      const { data: rows, error: ve } = await supabase
        .from("vessels")
        .select("id")
        .eq("vessel_name", vesselName)
        .limit(1);
      if (!ve && Array.isArray(rows) && rows.length > 0) vesselId = rows[0].id as unknown as string;
    }
    // Auto-create vessel in master if not exists
    if (!vesselId) {
      // Try insert; if name unique exists elsewhere, re-select
      const { error: insErr } = await supabase
        .from("vessels")
        .insert({ vessel_name: vesselName });
      if (insErr && !String(insErr.message || "").toLowerCase().includes("duplicate")) {
        return NextResponse.json({ message: "Failed to upsert vessel", details: insErr.message }, { status: 500 });
      }
      const { data: rows2 } = await supabase
        .from("vessels")
        .select("id")
        .eq("vessel_name", vesselName)
        .order("id", { ascending: true })
        .limit(1);
      vesselId = Array.isArray(rows2) && rows2.length > 0 ? (rows2[0].id as unknown as string) : null;
      if (!vesselId) return NextResponse.json({ message: "Failed to resolve vessel id" }, { status: 500 });
    }
    // tentukan seq: jika position diberikan (>=1) gunakan itu; jika tidak next
    let seq = position && position > 0 ? position : null;
    if (seq == null) {
      const { data: maxRows } = await supabase
        .from("month_vessels")
        .select("seq")
        .eq("month_year", monthYear)
        .order("seq", { ascending: false })
        .limit(1);
      const maxSeq = Array.isArray(maxRows) && maxRows.length > 0 ? (maxRows[0]?.seq as number ?? 0) : 0;
      seq = maxSeq + 1;
    }
    // derive next display_order
    const { data: dmax } = await supabase
      .from("month_vessels")
      .select("display_order")
      .eq("month_year", monthYear)
      .order("display_order", { ascending: false, nullsFirst: false })
      .limit(1);
    const maxDisp = Array.isArray(dmax) && dmax.length > 0 ? ((dmax[0]?.display_order as number | null) ?? 0) : 0;
    const display_order = maxDisp + 1;

    const { error } = await supabase
      .from("month_vessels")
      .insert({ month_year: monthYear, vessel_id: vesselId, seq, display_order, created_at: new Date().toISOString() });
    if (error) return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });
    return NextResponse.json({ message: "Added", seq }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { monthYear: string; vesselName: string; seq?: number };
    const { monthYear, vesselName, seq } = body;
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear) || !vesselName) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { data: v, error: ve } = await supabase
      .from("vessels")
      .select("id")
      .eq("vessel_name", vesselName)
      .single();
    if (ve || !v) return NextResponse.json({ message: "Vessel not found" }, { status: 404 });
    // Cari semua mapping untuk kapal ini pada bulan tsb
    const { data: maps, error: mapErr } = await supabase
      .from("month_vessels")
      .select("seq")
      .eq("month_year", monthYear)
      .eq("vessel_id", v.id)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("seq", { ascending: true });
    if (mapErr) return NextResponse.json({ message: "Database error", details: mapErr.message }, { status: 500 });

    // Jika tidak ada mapping: hapus semua data rates untuk kapal tsb pada bulan ini, lalu selesai
    if (!maps || maps.length === 0) {
      const { error: delAllRatesErr } = await supabase
        .from("loading_ritase_rates")
        .delete()
        .eq("month_year", monthYear)
        .eq("vessel_id", v.id);
      if (delAllRatesErr) return NextResponse.json({ message: "Database error", details: delAllRatesErr.message }, { status: 500 });
      return NextResponse.json({ message: "Removed rates only (no mapping)" });
    }

    // Tentukan seq target yang akan dihapus
    let targetSeq: number = maps[0].seq as number;
    if (seq && Number.isInteger(seq)) {
      const exists = maps.some((m) => (m.seq as number) === seq);
      if (exists) targetSeq = seq;
    }

    // Hapus data rates untuk seq tsb pada bulan ini
    const { error: delRatesErr } = await supabase
      .from("loading_ritase_rates")
      .delete()
      .eq("month_year", monthYear)
      .eq("month_vessel_seq", targetSeq);
    if (delRatesErr) return NextResponse.json({ message: "Database error", details: delRatesErr.message }, { status: 500 });

    // Hapus mapping bulan
    const { error: delMapErr } = await supabase
      .from("month_vessels")
      .delete()
      .eq("month_year", monthYear)
      .eq("seq", targetSeq);
    if (delMapErr) return NextResponse.json({ message: "Database error", details: delMapErr.message }, { status: 500 });
    return NextResponse.json({ message: "Removed" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { monthYear: string; order: Array<{ seq: number; display_order: number }> };
    const { monthYear, order } = body;
    if (!monthYear || !/\d{4}-\d{2}/.test(monthYear) || !Array.isArray(order)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    // update display_order per seq
    for (const item of order) {
      if (!item || typeof item.seq !== 'number' || typeof item.display_order !== 'number') continue;
      const { error } = await supabase
        .from('month_vessels')
        .update({ display_order: item.display_order })
        .eq('month_year', monthYear)
        .eq('seq', item.seq);
      if (error) return NextResponse.json({ message: 'Database error', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Reordered' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


