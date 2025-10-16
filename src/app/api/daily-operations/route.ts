import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

type LoadingRateRow = { loading_date: string; ritase_rate: number | null };
type DailyOpsRow = {
  record_date: string;
  produksi_mining?: number | null;
  produksi_qc?: number | null;
  penjualan?: number | null;
  vessel_complete?: number | null;
  stock_awal?: number | null;
};
type DailyMetric = {
  id: number;
  record_date: string;
  total_realisasi: number;
  target: number;
  stock_awal: number;
  produksi_mining?: number;
  produksi_qc?: number;
  penjualan: number;
  vessel_complete: number;
  created_at: string;
};

function isDailyOpsRow(x: unknown): x is DailyOpsRow {
  if (typeof x !== "object" || x === null) return false;
  return typeof (x as Record<string, unknown>).record_date === "string";
}
function monthRange(ym: string) {
  const y = parseInt(ym.slice(0, 4), 10);
  const m = parseInt(ym.slice(5, 7), 10);
  const end = new Date(y, m, 0).getDate();
  return { start: `${ym}-01`, end: `${ym}-${String(end).padStart(2, "0")}`, days: end };
}

async function getMonthlyTarget(supabase: ReturnType<typeof createServerSupabaseClient> extends Promise<infer T> ? T : any, ym: string): Promise<number> {
  const year = parseInt(ym.slice(0, 4), 10);
  const month = parseInt(ym.slice(5, 7), 10);
  const { data, error } = await supabase
    .from("monthly_targets")
    .select("target")
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  if (error) return 0;
  const t = (data as { target?: number } | null)?.target ?? 0;
  return Number.isFinite(t) ? t : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const date = searchParams.get("date");   // YYYY-MM-DD

    const supabase = await createServerSupabaseClient();

    // by date (halaman edit)
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ message: "Invalid 'date'. Expected YYYY-MM-DD" }, { status: 400 });
      }

      const { data: loadRows, error: loadErr } = await supabase
        .from("loading_ritase_rates")
        .select("ritase_rate")
        .eq("loading_date", date);
      if (loadErr) return NextResponse.json({ message: loadErr.message }, { status: 500 });

      const totalRealisasi = (loadRows ?? []).reduce((s, r) => s + (r.ritase_rate ?? 0), 0);

      const { data: opsRow, error: opsErr } = await supabase
        .from("daily_operations")
        .select("*")
        .eq("record_date", date)
        .maybeSingle();
      if (opsErr) return NextResponse.json({ message: opsErr.message }, { status: 500 });

      const produksiMining = (opsRow as DailyOpsRow | null)?.produksi_mining ?? 0;
      const produksiQc = (opsRow as DailyOpsRow | null)?.produksi_qc ?? 0;
      const ym = date.slice(0, 7);
      const monthTarget = await getMonthlyTarget(supabase, ym);

      const merged: DailyMetric = {
        id: 1,
        record_date: date,
        total_realisasi: totalRealisasi,
        target: monthTarget,
        stock_awal: (opsRow as DailyOpsRow | null)?.stock_awal ?? 0,
        produksi_mining: produksiMining ?? 0,
        produksi_qc: produksiQc ?? 0,
        penjualan: (opsRow as DailyOpsRow | null)?.penjualan ?? 0,
        vessel_complete:
          (opsRow as DailyOpsRow | null)?.vessel_complete ?? 0,
        created_at: new Date().toISOString(),
      };
      return NextResponse.json(merged);
    }

    // by month (array harian)
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ message: "Invalid 'month'. Expected YYYY-MM" }, { status: 400 });
      }
      const { start, end, days } = monthRange(month);

      const { data: loadRows, error: loadErr } = await supabase
        .from("loading_ritase_rates")
        .select("loading_date, ritase_rate")
        .gte("loading_date", start)
        .lte("loading_date", end);
      if (loadErr) return NextResponse.json({ message: loadErr.message }, { status: 500 });

      const ritaseByDate = new Map<string, number>();
      (loadRows ?? []).forEach((r) => {
        const row = r as LoadingRateRow;
        ritaseByDate.set(
          row.loading_date,
          (ritaseByDate.get(row.loading_date) ?? 0) + (row.ritase_rate ?? 0)
        );
      });

      const { data: opsRows, error: opsErr } = await supabase
        .from("daily_operations")
        .select("*")
        .gte("record_date", start)
        .lte("record_date", end);
      if (opsErr) return NextResponse.json({ message: opsErr.message }, { status: 500 });

      const opsByDate = new Map<string, DailyOpsRow>();
      (opsRows ?? []).forEach((row) => { if (isDailyOpsRow(row)) opsByDate.set((row as DailyOpsRow).record_date, row as DailyOpsRow); });

      const monthTarget = await getMonthlyTarget(supabase, month);

      const daily: DailyMetric[] = Array.from({ length: days }, (_, i) => {
        const d = `${month}-${String(i + 1).padStart(2, "0")}`;
        const ops = opsByDate.get(d);
        const pMining = ops?.produksi_mining ?? 0;
        const pQc = ops?.produksi_qc ?? 0;
        return {
          id: i + 1,
          record_date: d,
          total_realisasi: ritaseByDate.get(d) ?? 0,
          target: monthTarget,
          stock_awal: ops?.stock_awal ?? 0,
          produksi_mining: pMining ?? 0,
          produksi_qc: pQc ?? 0,
          penjualan: ops?.penjualan ?? 0,
          vessel_complete: ops?.vessel_complete ?? 0,
          created_at: new Date().toISOString(),
        };
      });

      return NextResponse.json(daily);
    }

    return NextResponse.json({ message: "Query param 'month' or 'date' is required." }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { 
      date?: string; 
      month?: string; 
      penjualan?: number | null; 
      kunjungan?: number | null; 
      target?: number | null; 
      stockAwal?: number | null;
      produksi_mining?: number | null;
      produksi_qc?: number | null;
    };
    const { date, month, penjualan, kunjungan, target, stockAwal, produksi_mining, produksi_qc } = body;

    if (penjualan != null && !Number.isFinite(penjualan)) {
      return NextResponse.json({ message: "Invalid 'penjualan' number" }, { status: 400 });
    }
    if (kunjungan != null && !Number.isInteger(kunjungan)) {
      return NextResponse.json({ message: "Invalid 'kunjungan' integer" }, { status: 400 });
    }
    if (target != null && !Number.isFinite(target)) {
      return NextResponse.json({ message: "Invalid 'target' number" }, { status: 400 });
    }
    if (stockAwal != null && !Number.isFinite(stockAwal)) {
      return NextResponse.json({ message: "Invalid 'stockAwal' number" }, { status: 400 });
    }
    if (produksi_mining != null && !Number.isFinite(produksi_mining)) {
      return NextResponse.json({ message: "Invalid 'produksi_mining' number" }, { status: 400 });
    }
    if (produksi_qc != null && !Number.isFinite(produksi_qc)) {
      return NextResponse.json({ message: "Invalid 'produksi_qc' number" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();
    // Fallback: if edge runtime loses session, try server-side cookie session by creating a new client from request
    // (createServerSupabaseClient already binds to request in this app setup)
    const bureu = (() => {
      const u = authData?.user as any;
      const m = u?.user_metadata;
      const a = u?.app_metadata;
      const rm = u?.raw_user_meta_data;
      const ra = u?.raw_app_meta_data;
      const v = (a && typeof a.bureu === 'string' && a.bureu)
        || (m && typeof m.bureu === 'string' && m.bureu)
        || (ra && typeof ra.bureu === 'string' && ra.bureu)
        || (rm && typeof rm.bureu === 'string' && rm.bureu)
        || null;
      return typeof v === 'string' ? (v as string).toLowerCase() : null;
    })();
    const headerBureu = request.headers.get('x-bureu');
    const bureuFinal = (bureu ?? (headerBureu ? headerBureu.toLowerCase() : null));

    // Update target per bulan (shipping only) -> monthly_targets upsert
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ message: "Invalid 'month'. Expected YYYY-MM" }, { status: 400 });
      }
      if (target == null) {
        return NextResponse.json({ message: "'target' is required for monthly update" }, { status: 400 });
      }
      if (bureuFinal !== 'shipping') {
        return NextResponse.json({ message: "Forbidden: only 'shipping' can update monthly target" }, { status: 403 });
      }
      const year = parseInt(month.slice(0, 4), 10);
      const mon = parseInt(month.slice(5, 7), 10);
      const { error } = await supabase
        .from("monthly_targets")
        .upsert({ year, month: mon, target, updated_at: new Date().toISOString(), created_at: new Date().toISOString() }, { onConflict: "year,month" });
      if (error) return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });
      return NextResponse.json({ message: "Monthly target updated" });
    }

    // Update harian by date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: "Invalid or missing 'date'. Expected YYYY-MM-DD" }, { status: 400 });
    }
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (penjualan != null) payload.penjualan = Math.round(penjualan * 1000) / 1000;
    if (kunjungan != null) {
      payload.vessel_complete = kunjungan;
    }
    if (stockAwal != null) {
      // hanya QC yang boleh update stock_awal
      if (bureuFinal !== 'qc') {
        return NextResponse.json({ message: "Forbidden: only 'qc' can update stock_awal" }, { status: 403 });
      }
      payload.stock_awal = stockAwal;
    }
    if (produksi_mining != null) {
      // hanya mining yang boleh update produksi_mining
      if (bureuFinal !== 'mining') {
        return NextResponse.json({ message: "Forbidden: only 'mining' can update produksi_mining" }, { status: 403 });
      }
      payload.produksi_mining = produksi_mining;
    }
    if (produksi_qc != null) {
      // hanya qc yang boleh update produksi_qc
      if (bureuFinal !== 'qc') {
        return NextResponse.json({ message: "Forbidden: only 'qc' can update produksi_qc" }, { status: 403 });
      }
      payload.produksi_qc = produksi_qc;
    }

    const { data, error } = await supabase
      .from("daily_operations")
      .update(payload)
      .eq("record_date", date)
      .select();

    if (error) return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Updated" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date: string; 
      penjualan?: number | null; 
      kunjungan?: number | null;
      target?: number | null; 
      stockAwal?: number | null;
      produksi_mining?: number | null;
      produksi_qc?: number | null;
    };
    const { date } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ message: "Invalid or missing 'date'. Expected YYYY-MM-DD" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const insertPayload: Record<string, unknown> = {
      record_date: date,
      penjualan: body.penjualan != null ? Math.round(body.penjualan * 1000) / 1000 : 0,
      vessel_complete: body.kunjungan ?? 0,
      target: body.target ?? 0,
      stock_awal: body.stockAwal ?? 0,
      produksi_mining: body.produksi_mining ?? 0,
      produksi_qc: body.produksi_qc ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("daily_operations").insert(insertPayload);
    if (error) return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });

    return NextResponse.json({ message: "Created" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}