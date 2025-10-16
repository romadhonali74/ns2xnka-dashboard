// app/api/monthly-rates/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase"; // Sesuaikan path jika berbeda

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    // Kita bisa membuat tahun dinamis jika diperlukan, tapi untuk sekarang pakai tahun saat ini
    const currentYear = new Date().getFullYear();

    // Memanggil fungsi RPC PostgreSQL
    const { data: monthlyMetrics, error } = await supabase.rpc('get_monthly_metrics', { p_year: currentYear });

    if (error) {
      console.error("Supabase error fetching monthly metrics:", error);
      return NextResponse.json(
        {
          message: "Failed to fetch monthly metrics",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Data dari fungsi RPC sudah dalam format yang bagus
    return NextResponse.json(monthlyMetrics);
  } catch (error: unknown) {
    console.error("Error in /api/monthly-rates GET:", error);
    return NextResponse.json(
      { message: "Internal Server Error", details: error || "Unknown error" },
      { status: 500 }
    );
  }
}