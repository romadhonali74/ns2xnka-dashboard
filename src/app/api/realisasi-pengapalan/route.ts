// app/api/realisasi-pengapalan/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase"; // Sesuaikan path jika berbeda

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const currentYear = new Date().getFullYear(); // Ambil tahun saat ini

    // Memanggil fungsi RPC PostgreSQL yang baru
    const { data: realisasiData, error } = await supabase.rpc('get_monthly_realisasi_pengapalan', { p_year: currentYear });

    if (error) {
      console.error("Supabase error fetching realisasi pengapalan:", error.message, error.details, error.code);
      return NextResponse.json(
        {
          message: "Failed to fetch realisasi pengapalan data",
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(realisasiData);
  } catch (error: unknown) {
    console.error("Error in /api/realisasi-pengapalan GET:", error || error);
    return NextResponse.json(
      { message: "Internal Server Error", details: error || "Unknown error" },
      { status: 500 }
    );
  }
}
