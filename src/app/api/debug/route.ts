import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "No supabase client" });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("monthYear") || "2025-01";
    
    // Check vessel status table for current month
    const { data: vesselStatuses, error: statusError } = await supabase
      .from("vessel_status")
      .select("*")
      .eq("month_year", monthYear);
    
    // Check loading ritase rates table for the month
    const { data: loadingRates, error: loadingError } = await supabase
      .from("loading_ritase_rates")
      .select(`
        loading_date, 
        ritase_rate, 
        loading_rate,
        vessels!inner(vessel_name)
      `)
      .eq("month_year", monthYear)
      .order("loading_date", { ascending: true })
      .limit(20);
    
    // Check previous month carry over
    const [year, month] = monthYear.split("-").map(Number);
    const prevDate = new Date(year, month - 1, 1);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthYear = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    
    const { data: prevMonthStatuses, error: prevError } = await supabase
      .from("vessel_status")
      .select("*")
      .eq("month_year", prevMonthYear)
      .eq("status", "carry_over_to_next_month");
    
    // Get all vessel status records to see what's available
    const { data: allStatuses } = await supabase
      .from("vessel_status")
      .select("month_year, vessel_name, status")
      .order("month_year", { ascending: false })
      .limit(10);
    
    // Calculate totals like the realisasi API does
    const completedNames = vesselStatuses?.filter(v => v.status === "completed").map(v => v.vessel_name) || [];
    const carryOverNames = prevMonthStatuses?.map(v => v.vessel_name) || [];
    const allVesselNames = [...completedNames, ...carryOverNames];
    
    let totalRitase = 0;
    let totalLoading = 0;
    
    if (loadingRates) {
      loadingRates.forEach((row: any) => {
        const vesselName = row.vessels?.vessel_name;
        if (allVesselNames.length === 0 || allVesselNames.includes(vesselName)) {
          if (row.ritase_rate) totalRitase += row.ritase_rate;
          if (row.loading_rate) totalLoading += row.loading_rate;
        }
      });
    }
    
    return NextResponse.json({
      monthYear,
      prevMonthYear,
      summary: {
        completedVesselsCount: completedNames.length,
        carryOverVesselsCount: carryOverNames.length,
        loadingRatesCount: loadingRates?.length || 0,
        totalRitase,
        totalLoading
      },
      completedVessels: completedNames,
      carryOverVessels: carryOverNames,
      allVesselNames,
      vesselStatuses: vesselStatuses || [],
      loadingRatesSample: loadingRates || [],
      allStatusesSample: allStatuses || [],
      errors: {
        statusError: statusError?.message,
        loadingError: loadingError?.message,
        prevError: prevError?.message
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}