import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(request: NextRequest) {
  if (!supabase) {
    console.log('No supabase client available');
    return NextResponse.json({ data: {} });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("monthYear");
    const noFilter = searchParams.get("noFilter") === 'true';
    if (!monthYear) {
      return NextResponse.json({ data: {} });
    }
    
    // If noFilter is true, return all vessels without status filtering
    if (noFilter) {
      const { data: allData } = await supabase
        .from("loading_ritase_rates")
        .select("ritase_rate, loading_rate")
        .eq("month_year", monthYear);
      
      let totalRitase = 0;
      let totalLoading = 0;
      
      if (allData) {
        allData.forEach((row: any) => {
          if (row.ritase_rate) totalRitase += row.ritase_rate;
          if (row.loading_rate) totalLoading += row.loading_rate;
        });
      }
      
      return NextResponse.json({ 
        data: { 
          totalRitase, 
          totalLoading,
          debug: { message: "No vessel status filter applied", count: allData?.length }
        } 
      });
    }

    // Get completed vessels for this month with their ritase totals
    const { data: completedVessels, error: completedError } = await supabase
      .from("vessel_status")
      .select("vessel_name, ritase_rates_total")
      .eq("month_year", monthYear)
      .eq("status", "completed");
    
    // Get carry over vessels from current month (these should be EXCLUDED)
    const { data: currentCarryOverVessels } = await supabase
      .from("vessel_status")
      .select("vessel_name, ritase_rates_total")
      .eq("month_year", monthYear)
      .eq("status", "carry_over_to_next_month");
    
    // Get carry over vessels from previous month (these will use previous month data)
    const [year, month] = monthYear.split("-").map(Number);
    const prevDate = new Date(year, month - 1, 1);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthYear = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    
    const { data: carryOverVessels, error: carryOverError } = await supabase
      .from("vessel_status")
      .select("vessel_name, ritase_rates_total")
      .eq("month_year", prevMonthYear)
      .eq("status", "carry_over_to_next_month");
    
    // Process vessel names - keep full names for exact matching
    const completedVesselNames = completedVessels?.map(v => v.vessel_name) || [];
    const carryOverVesselNames = carryOverVessels?.map(v => v.vessel_name) || [];
    const excludeVesselNames = currentCarryOverVessels?.map(v => v.vessel_name) || [];
    
    // Also get base names for display purposes
    const completedBaseNames = completedVessels?.map(v => {
      return v.vessel_name.includes('_seq') ? v.vessel_name.split('_seq')[0] : v.vessel_name;
    }) || [];
    const carryOverBaseNames = carryOverVessels?.map(v => {
      return v.vessel_name.includes('_seq') ? v.vessel_name.split('_seq')[0] : v.vessel_name;
    }) || [];
    
    // Count actual vessels (remove _seq for counting)
    const actualCompletedCount = completedVessels?.length || 0;
    const actualCarryOverCount = carryOverVessels?.length || 0;
    



    
    // If no vessels have status, return zero (no fallback to all vessels)
    if (completedVesselNames.length === 0 && carryOverVesselNames.length === 0) {
      return NextResponse.json({ 
        data: { 
          totalRitase: 0, 
          totalLoading: 0,
          completedVessels: [],
          carryOverVessels: [],
          debug: {
            monthYear,
            message: "No completed or carry over vessels found",
            dataCount: 0
          }
        } 
      });
    }
    
    let totalRitase = 0;
    let totalLoading = 0;
    let dataCount = 0;
    let completedTotal = 0;
    let carryOverTotal = 0;
    
    // Calculate ritase from completed vessels only
    if (completedVessels) {
      completedVessels.forEach(vessel => {
        if (vessel.ritase_rates_total) {
          completedTotal += vessel.ritase_rates_total;
          totalRitase += vessel.ritase_rates_total;
          dataCount++;
        }
      });
    }
    
    // Add carry over vessels from previous month
    if (carryOverVessels) {
      carryOverVessels.forEach(vessel => {
        if (vessel.ritase_rates_total) {
          carryOverTotal += vessel.ritase_rates_total;
          totalRitase += vessel.ritase_rates_total;
          dataCount++;
        }
      });
    }
    
    // COMMENTED: loading_ritase_rates query (not used in curve chart)
    // Get loading data from loading_ritase_rates
    // const { data: monthlyLoadingData } = await supabase
    //   .from("loading_ritase_rates")
    //   .select("loading_rate")
    //   .eq("month_year", monthYear);
    // 
    // if (monthlyLoadingData) {
    //   monthlyLoadingData.forEach(row => {
    //     if (row.loading_rate) totalLoading += row.loading_rate;
    //   });
    // }
    


    return NextResponse.json({ 
      data: { 
        totalRitase, 
        totalLoading,
        completedVessels: completedBaseNames,
        carryOverVessels: carryOverBaseNames,
        debug: {
          monthYear,
          prevMonthYear,
          completedVesselsCount: actualCompletedCount,
          carryOverVesselsCount: actualCarryOverCount,
          dataCount: dataCount,
          calculation: {
            completedVesselsWithRitase: completedVessels?.filter(v => v.ritase_rates_total).length || 0,
            excludedVessels: currentCarryOverVessels?.length || 0,
            carryOverFromPrevMonth: carryOverVessels?.filter(v => v.ritase_rates_total).length || 0,
            completedTotal: completedTotal,
            carryOverTotal: carryOverTotal,
            finalTotal: totalRitase
          }
        }
      } 
    });
  } catch (error) {

    return NextResponse.json({ 
      data: { totalRitase: 0, totalLoading: 0 },
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}