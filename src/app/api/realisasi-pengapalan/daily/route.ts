import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

type LoadingRateRow = {
  loading_date: string;      // YYYY-MM-DD
  ritase_rate: number | null;
};

type DailyOpsRow = {
  record_date: string;       // YYYY-MM-DD
  produksi_mining?: number | null;
  produksi_qc?: number | null;
  penjualan?: number | null;
  total_kunjungan?: number | null;
  vessel_complete?: number | null;
  target?: number | null;
  stock_awal?: number | null;
};

type DailyMetric = {
  id: number;
  record_date: string;
  total_realisasi: number;   // SUM(ritase_rate) per tanggal
  target: number;
  stock_awal: number;
  produksi: number;           // back-compat: mining + qc
  produksi_mining?: number;
  produksi_qc?: number;
  penjualan: number;
  total_kunjungan: number;    // back-compat: from vessel_complete
  created_at: string;
};

function isDailyOpsRow(x: unknown): x is DailyOpsRow {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.record_date === "string";
}

function getMonthStartEnd(ym: string): { startDate: string; endDate: string } {
  const year = parseInt(ym.slice(0, 4), 10);
  const mon = parseInt(ym.slice(5, 7), 10);
  const endDay = new Date(year, mon, 0).getDate();
  return { startDate: `${ym}-01`, endDate: `${ym}-${String(endDay).padStart(2, "0")}` };
}

function generateDateStrings(ym: string): string[] {
  const year = parseInt(ym.slice(0, 4), 10);
  const mon = parseInt(ym.slice(5, 7), 10);
  const endDay = new Date(year, mon, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= endDay; d++) dates.push(`${ym}-${String(d).padStart(2, "0")}`);
  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const date = searchParams.get("date");   // YYYY-MM-DD

    const supabase = await createServerSupabaseClient();

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ message: "Invalid 'date'. Expected YYYY-MM-DD" }, { status: 400 });
      }

      const { data: loadRows, error: loadErr } = await supabase
        .from("loading_ritase_rates")
        .select("ritase_rate")
        .eq("loading_date", date);

      if (loadErr) {
        return NextResponse.json({ message: "Database error (loading_ritase_rates)", details: loadErr.message }, { status: 500 });
      }

      const totalRealisasi = (loadRows ?? []).reduce((acc, r) => acc + (r.ritase_rate ?? 0), 0);

      const { data: opsRow, error: opsErr } = await supabase
        .from("daily_operations")
        .select("*")
        .eq("record_date", date)
        .maybeSingle();

      if (opsErr) {
        return NextResponse.json({ message: "Database error (daily_operations)", details: opsErr.message }, { status: 500 });
      }

      const mining = (opsRow as DailyOpsRow | null)?.produksi_mining ?? 0;
      const qc = (opsRow as DailyOpsRow | null)?.produksi_qc ?? 0;

      const merged: DailyMetric = {
        id: 1,
        record_date: date,
        total_realisasi: totalRealisasi,
        target: (opsRow as DailyOpsRow | null)?.target ?? 0,
        stock_awal: (opsRow as DailyOpsRow | null)?.stock_awal ?? 0,
        produksi: (mining + qc),
        produksi_mining: mining,
        produksi_qc: qc,
        penjualan: (opsRow as DailyOpsRow | null)?.penjualan ?? 0,
        total_kunjungan:
          (opsRow as DailyOpsRow | null)?.vessel_complete ??
          (opsRow as DailyOpsRow | null)?.total_kunjungan ??
          0,
        created_at: new Date().toISOString(),
      };

      return NextResponse.json(merged);
    }

    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ message: "Invalid 'month'. Expected YYYY-MM" }, { status: 400 });
      }

      const { startDate, endDate } = getMonthStartEnd(month);

      const { data: loadRows, error: loadErr } = await supabase
        .from("loading_ritase_rates")
        .select("loading_date, ritase_rate")
        .gte("loading_date", startDate)
        .lte("loading_date", endDate);

      if (loadErr) {
        return NextResponse.json({ message: "Database error (loading_ritase_rates)", details: loadErr.message }, { status: 500 });
      }

      const ritaseByDate = new Map<string, number>();
      (loadRows ?? []).forEach((r) => {
        const row = r as LoadingRateRow;
        ritaseByDate.set(row.loading_date, (ritaseByDate.get(row.loading_date) ?? 0) + (row.ritase_rate ?? 0));
      });

      const { data: opsRows, error: opsErr } = await supabase
        .from("daily_operations")
        .select("*")
        .gte("record_date", startDate)
        .lte("record_date", endDate);

      if (opsErr) {
        return NextResponse.json({ message: "Database error (daily_operations)", details: opsErr.message }, { status: 500 });
      }

      const opsByDate = new Map<string, DailyOpsRow>();
      (opsRows ?? []).forEach((row) => {
        if (isDailyOpsRow(row)) opsByDate.set(row.record_date, row);
      });

      const allDates = generateDateStrings(month);
      const daily: DailyMetric[] = allDates.map((d, idx) => {
        const ops = opsByDate.get(d);
        const mining = (ops?.produksi_mining ?? 0);
        const qc = (ops?.produksi_qc ?? 0);
        return {
          id: idx + 1,
          record_date: d,
          total_realisasi: ritaseByDate.get(d) ?? 0,
          target: ops?.target ?? 0,
          stock_awal: ops?.stock_awal ?? 0,
          produksi: mining + qc,
          produksi_mining: mining,
          produksi_qc: qc,
          penjualan: ops?.penjualan ?? 0,
          total_kunjungan: ops?.vessel_complete ?? ops?.total_kunjungan ?? 0,
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
      date: string;
      penjualan?: number | null;
      kunjungan?: number | null;
      produksi_mining?: number | null;
      produksi_qc?: number | null;
    };

    const { date, penjualan, kunjungan, produksi_mining, produksi_qc } = body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { message: "Invalid or missing 'date'. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (penjualan != null && !Number.isFinite(penjualan)) {
      return NextResponse.json(
        { message: "Invalid 'penjualan' number" },
        { status: 400 }
      );
    }
    if (kunjungan != null && !Number.isInteger(kunjungan)) {
      return NextResponse.json(
        { message: "Invalid 'kunjungan' integer" },
        { status: 400 }
      );
    }
    if (produksi_mining != null && !Number.isFinite(produksi_mining)) {
      return NextResponse.json(
        { message: "Invalid 'produksi_mining' number" },
        { status: 400 }
      );
    }
    if (produksi_qc != null && !Number.isFinite(produksi_qc)) {
      return NextResponse.json(
        { message: "Invalid 'produksi_qc' number" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    // robust bureu extraction: header first, then metadata variants
    let bureu: string | null = null;
    const headerB = request.headers.get("x-bureu");
    if (headerB) bureu = headerB.toLowerCase();
    if (!bureu) {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user as any;
      const candidates = [
        user?.app_metadata?.bureu,
        user?.user_metadata?.bureu,
        user?.raw_app_meta_data?.bureu,
        user?.raw_user_meta_data?.bureu,
      ];
      const found = candidates.find((v: any) => typeof v === "string");
      bureu = found ? String(found).toLowerCase() : null;
    }

    // Update hanya kolom yang dikirim
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (penjualan != null) updatePayload.penjualan = Math.trunc(penjualan);
    if (kunjungan != null) {
      updatePayload.total_kunjungan = kunjungan;
      updatePayload.vessel_complete = kunjungan;
    }
    if (produksi_mining != null) {
      if (bureu !== "mining") {
        return NextResponse.json(
          { message: "Forbidden: hanya bureu 'mining' yang boleh mengubah produksi_mining" },
          { status: 403 }
        );
      }
      updatePayload.produksi_mining = produksi_mining;
    }
    if (produksi_qc != null) {
      if (bureu !== "qc") {
        return NextResponse.json(
          { message: "Forbidden: hanya bureu 'qc' yang boleh mengubah produksi_qc" },
          { status: 403 }
        );
      }
      updatePayload.produksi_qc = produksi_qc;
    }

    const { data, error } = await supabase
      .from("daily_operations")
      .update(updatePayload)
      .eq("record_date", date)
      .select();

    if (error) {
      return NextResponse.json(
        { message: "Database error", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Updated" });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date: string;
      penjualan?: number | null;
      kunjungan?: number | null;
      produksi?: number | null;
      target?: number | null;
      stockAwal?: number | null;
    };

    const { date } = body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { message: "Invalid or missing 'date'. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const insertPayload: Record<string, unknown> = {
      record_date: date,
      penjualan: body.penjualan != null ? Math.trunc(body.penjualan) : 0,
      total_kunjungan: body.kunjungan ?? 0,
      vessel_complete: body.kunjungan ?? 0,
      produksi: body.produksi ?? 0,
      target: body.target ?? 0,
      stock_awal: body.stockAwal ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("daily_operations")
      .insert(insertPayload);

    if (error) {
      return NextResponse.json(
        { message: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Created" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}