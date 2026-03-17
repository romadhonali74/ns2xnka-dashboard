import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase"; // Sesuaikan path jika berbeda

// GET /api/daily-rates?month=YYYY-MM (e.g., ?month=2025-05)
// GET /api/daily-rates?date=YYYY-MM-DD (untuk mengambil satu entri harian)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // Akan mendapatkan "YYYY-MM"
    const dateParam = searchParams.get("date"); // Akan mendapatkan "YYYY-MM-DD"

    if (dateParam) {
      // Jika ada parameter 'date', ambil data untuk tanggal spesifik
      const { data: dailyMetric, error } = await supabase
        .from("loading_ritase_rate") // <<< PASTIKAN NAMA TABEL INI BENAR! (daily_metrics)
        .select("id, record_date, loading_rate, ritase_rate, created_at")
        .eq("record_date", dateParam) // Filter berdasarkan tanggal spesifik
        .single(); // Ambil satu baris saja

      // Tambahkan log error mentah di sini untuk debugging
      if (error) {
      }

      // Tangani kasus data tidak ditemukan secara eksplisit (PGRST116)
      if (error && error.code === "PGRST116") {
        // PGRST116 adalah kode untuk "no rows found"
        console.warn(
          `Supabase: No data found for date ${dateParam}. Returning 404.`
        );
        return NextResponse.json(
          { message: `No data found for date ${dateParam}.` },
          { status: 404 } // Mengembalikan 404 Not Found
        );
      }

      // Tangani error Supabase lainnya
      if (error) {
        console.error(
          "Supabase error fetching single daily metric:",
          error.message,
          error.details,
          error.code
        );
        return NextResponse.json(
          {
            message: "Failed to fetch daily metric for date",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      // Jika data ditemukan (bukan null), kembalikan data
      return NextResponse.json(dailyMetric);
    } else if (monthParam) {
      // Jika ada parameter 'month', ambil data untuk seluruh bulan
      if (!/^\d{4}-\d{2}$/.test(monthParam)) {
        return NextResponse.json(
          {
            message:
              "Parameter 'month' is required and must be in YYYY-MM format.",
          },
          { status: 400 }
        );
      }

      const [year, month] = monthParam.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Hari terakhir bulan

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const { data: dailyMetrics, error } = await supabase
        .from("loading_ritase_rate") // <<< PASTIKAN NAMA TABEL INI BENAR! (daily_metrics)
        .select("id, record_date, loading_rate, ritase_rate, created_at")
        .gte("record_date", formattedStartDate)
        .lte("record_date", formattedEndDate)
        .order("record_date", { ascending: true }); // Urutkan berdasarkan tanggal

      // Tambahkan log error mentah di sini untuk debugging
      if (error) {
      }

      // Tangani error Supabase (jika ada)
      // Jika error adalah PGRST116 (no rows found), kembalikan array kosong
      if (error && error.code === "PGRST116") {
        console.warn(
          `Supabase: No data found for month ${monthParam}. Returning empty array.`
        );
        return NextResponse.json([]); // Mengembalikan array kosong
      }

      if (error) {
        console.error(
          "Supabase error fetching daily metrics by month:",
          error.message,
          error.details,
          error.code
        );
        return NextResponse.json(
          {
            message: "Failed to fetch daily metrics by month",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }
      // Jika data ditemukan (bisa array kosong jika tidak ada data), kembalikan data
      return NextResponse.json(dailyMetrics || []); // Pastikan selalu mengembalikan array
    } else {
      // Jika tidak ada parameter 'month' atau 'date'
      return NextResponse.json(
        { message: "Missing 'month' or 'date' parameter." },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    // Refined catch block for better logging
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = (error as { message: string }).message;
    } else {
      errorMessage = String(error); // Convert any other type of error to string
    }
    console.error("Error in /api/daily-rates GET:", errorMessage, error);
    return NextResponse.json(
      { message: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/daily-rates (untuk membuat data harian baru)
export async function POST(request: NextRequest) {
  try {
    const { date, loadingRate, ritaseRate } = await request.json();

    if (!date || loadingRate === undefined || ritaseRate === undefined) {
      return NextResponse.json(
        {
          message: "Date, loadingRate, and ritaseRate are required for creation.",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("loading_ritase_rate")
      .insert({
        record_date: date,
        loading_rate: loadingRate,
        ritase_rate: ritaseRate,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Supabase error inserting daily metric:",
        error.message,
        error.details,
        error.code
      );
      return NextResponse.json(
        {
          message: "Failed to create daily metric",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = (error as { message: string }).message;
    } else {
      errorMessage = String(error);
    }
    console.error("Error in /api/daily-rates POST:", errorMessage, error);
    return NextResponse.json(
      { message: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/daily-rates (untuk memperbarui data harian berdasarkan tanggal)
export async function PUT(request: NextRequest) {
  try {
    const { date, loadingRate, ritaseRate } = await request.json();

    if (!date || loadingRate === undefined || ritaseRate === undefined) {
      return NextResponse.json(
        {
          message: "Date, loadingRate, and ritaseRate are required for update.",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const updatePayload: {
      loading_rate?: number;
      ritase_rate?: number;
    } = {};

    if (loadingRate !== undefined) updatePayload.loading_rate = loadingRate;
    if (ritaseRate !== undefined) updatePayload.ritase_rate = ritaseRate;

    const { data, error } = await supabase
      .from("loading_ritase_rate")
      .update(updatePayload)
      .eq("record_date", date)
      .select()
      .single();

    // Tangani kasus di mana tidak ada baris yang diperbarui (No Rows Found)
    if (error && error.code === 'PGRST116') {
        return NextResponse.json(
          { message: "No record found for the given date to update." },
          { status: 404 }
        );
    }

    // Tangani error Supabase lainnya
    if (error) {
      console.error("Supabase error updating daily metric:", error.message, error.details, error.code);
      return NextResponse.json(
        {
          message: "Failed to update daily metric",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // if (!data) {
    //   return NextResponse.json({ message: "No record found for the given date to update." }, { status: 404 });
    // }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = (error as { message: string }).message;
    } else {
      errorMessage = String(error);
    }
    console.error("Error in /api/daily-rates PUT:", errorMessage, error);
    return NextResponse.json(
      { message: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}