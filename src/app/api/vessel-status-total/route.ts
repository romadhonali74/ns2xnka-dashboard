import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ data: { total: 0 } });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || "2025";
    
    // Get all completed vessels for the year
    const { data: completedVessels } = await supabase
      .from("vessel_status")
      .select("vessel_name, month_year, ritase_rates_total")
      .like("month_year", `${year}-%`)
      .eq("status", "completed");
    
    // Get all carry over vessels for the year
    const { data: carryOverVessels } = await supabase
      .from("vessel_status")
      .select("vessel_name, month_year, ritase_rates_total")
      .like("month_year", `${year}-%`)
      .eq("status", "carry_over_to_next_month");
    
    let total = 0;
    let breakdown: any = {};
    
    // Sum completed vessels
    if (completedVessels) {
      completedVessels.forEach(vessel => {
        if (vessel.ritase_rates_total) {
          total += vessel.ritase_rates_total;
          if (!breakdown[vessel.month_year]) {
            breakdown[vessel.month_year] = { completed: 0, carryOver: 0 };
          }
          breakdown[vessel.month_year].completed += vessel.ritase_rates_total;
        }
      });
    }
    
    // Sum carry over vessels
    if (carryOverVessels) {
      carryOverVessels.forEach(vessel => {
        if (vessel.ritase_rates_total) {
          total += vessel.ritase_rates_total;
          if (!breakdown[vessel.month_year]) {
            breakdown[vessel.month_year] = { completed: 0, carryOver: 0 };
          }
          breakdown[vessel.month_year].carryOver += vessel.ritase_rates_total;
        }
      });
    }
    
    return NextResponse.json({ 
      data: { 
        total,
        breakdown,
        completedCount: completedVessels?.length || 0,
        carryOverCount: carryOverVessels?.length || 0
      } 
    });
  } catch (error) {
    return NextResponse.json({ 
      data: { total: 0 },
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}