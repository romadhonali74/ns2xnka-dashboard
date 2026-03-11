import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");

    let query = supabase.from("price_monthly").select("*");

    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (!isNaN(year)) {
        query = query.eq("year", year);
      }
    }

    query = query.order("year", { ascending: true })
                 .order("month", { ascending: true })
                 .order("periode", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error fetching price_monthly:", error);
      return NextResponse.json(
        { message: "Failed to fetch price data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching price_monthly:", error);
    return NextResponse.json(
      { message: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, periode1, periode2 } = body;

    if (!year || !month || !periode1 || !periode2) {
      return NextResponse.json(
        { message: "Year, month, periode1, and periode2 are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Insert both periods
    const records = [
      {
        year,
        month,
        periode: 1,
        hma: periode1.hma ? parseFloat(periode1.hma) : null,
        premium: periode1.premium ? parseFloat(periode1.premium) : null,
        hpm: periode1.hpm ? parseFloat(periode1.hpm) : null,
        harga_jual: periode1.harga_jual ? parseFloat(periode1.harga_jual) : null,
      },
      {
        year,
        month,
        periode: 2,
        hma: periode2.hma ? parseFloat(periode2.hma) : null,
        premium: periode2.premium ? parseFloat(periode2.premium) : null,
        hpm: periode2.hpm ? parseFloat(periode2.hpm) : null,
        harga_jual: periode2.harga_jual ? parseFloat(periode2.harga_jual) : null,
      },
    ];

    const { data, error } = await supabase
      .from("price_monthly")
      .upsert(records, { onConflict: "year,month,periode" })
      .select();

    if (error) {
      console.error("Supabase error saving price_monthly:", error);
      return NextResponse.json(
        { message: "Failed to save price data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error saving price_monthly:", error);
    return NextResponse.json(
      { message: "Failed to save price data" },
      { status: 500 }
    );
  }
}
