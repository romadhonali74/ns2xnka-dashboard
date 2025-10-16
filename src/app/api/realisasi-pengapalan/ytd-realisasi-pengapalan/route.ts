// app/api/ytd-realisasi-pengapalan/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase"; // Sesuaikan path jika berbeda

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const currentYear = new Date().getFullYear();

    // Memanggil fungsi RPC PostgreSQL untuk data YTD
    const { data: ytdData, error } = await supabase.rpc('get_ytd_realisasi_pengapalan', { p_year: currentYear });

    if (error) {
      console.error("Supabase error fetching YTD realisasi pengapalan:", error.message, error.details, error.code);
      return NextResponse.json(
        {
          message: "Failed to fetch YTD realisasi pengapalan data",
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(ytdData);
  } catch (error: unknown) {
    console.error("Error in /api/ytd-realisasi-pengapalan GET:", error || error);
    return NextResponse.json(
      { message: "Internal Server Error", details: error || "Unknown error" },
      { status: 500 }
    );
  }
}
