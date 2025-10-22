// app/api/significant-issues/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase"; // Import Supabase client

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month"); // '01'..'12'
    const bureuParam = searchParams.get("bureu");

    let query = supabase.from("significant_issues").select("*");

    const year = yearParam ? parseInt(yearParam, 10) : NaN;
    const month = monthParam ? parseInt(monthParam, 10) : NaN;

    if (!Number.isNaN(year)) {
      if (!Number.isNaN(month) && month >= 1 && month <= 12) {
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
        query = query.gte("tanggal", start).lte("tanggal", end);
      } else {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        query = query.gte("tanggal", start).lte("tanggal", end);
      }
    }

    if (bureuParam && bureuParam.trim().length > 0 && bureuParam.toLowerCase() !== 'all') {
      query = query.eq("bureu", bureuParam.toLowerCase());
    }

    query = query.order("tanggal", { ascending: true }).order("id", { ascending: true });

    const { data: issues, error } = await query;

    if (error) {
      console.error("Supabase error fetching issues:", error);
      return NextResponse.json(
        {
          message: "Failed to fetch significant issues",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching significant issues:", error);
    return NextResponse.json(
      { message: "Failed to fetch significant issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tanggal, keterangan } = await request.json();
    if (!tanggal || !keterangan) {
      return NextResponse.json(
        { message: "Tanggal and Keterangan are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    // Extract bureu from request header or authenticated user metadata (robust)
    let bureu: string | null = null;
    const headerBureu = request.headers.get('x-bureu');
    if (headerBureu && typeof headerBureu === 'string') {
      bureu = headerBureu.toLowerCase();
    } else {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user as any;
        const fromApp = user?.app_metadata?.bureu;
        const fromUser = user?.user_metadata?.bureu;
        const fromRawApp = user?.raw_app_meta_data?.bureu;
        const fromRawUser = user?.raw_user_meta_data?.bureu;
        bureu = (fromApp ?? fromUser ?? fromRawApp ?? fromRawUser ?? null);
        if (typeof bureu === 'string') bureu = bureu.toLowerCase();
      } catch {
        // ignore, DB trigger can backfill if configured
      }
    }
    const { data: newIssue, error } = await supabase
      .from("significant_issues")
      .insert([{ tanggal, keterangan, bureu }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error adding issue:", error);
      return NextResponse.json(
        { message: "Failed to add significant issue", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error("Error adding significant issue:", error);
    return NextResponse.json(
      { message: "Failed to add significant issue" },
      { status: 500 }
    );
  }
}
