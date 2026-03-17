import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ message: "Database configuration error" }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    const { vesselName, monthYear, status, vesselSequence } = body;

    if (!vesselName || !monthYear || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const sequence = vesselSequence || 1;

    // Create unique key using vessel name + sequence for now
    const uniqueVesselName = sequence > 1 ? `${vesselName}_seq${sequence}` : vesselName;
    
    // Calculate ritase_rates_total for this vessel (for all status types)
    let ritaseRatesTotal = 0;
    
    // Get vessel ID from vessels table using base vessel name (without sequence)
    const { data: vesselData } = await supabase
      .from("vessels")
      .select("id")
      .eq("vessel_name", vesselName)
      .single();
    
    if (vesselData) {
      let ritaseQuery = supabase
        .from("loading_ritase_rates")
        .select("ritase_rate, loading_date")
        .eq("vessel_id", vesselData.id)
        .eq("month_year", monthYear);
      
      // For sequence vessels, filter by month_vessel_seq
      if (sequence > 1) {
        ritaseQuery = ritaseQuery.eq("month_vessel_seq", sequence);
      } else {
        // For sequence 1, only get data where month_vessel_seq is null or 1
        ritaseQuery = ritaseQuery.or("month_vessel_seq.is.null,month_vessel_seq.eq.1");
      }
      
      const { data: ritaseData } = await ritaseQuery;
      
      if (ritaseData && ritaseData.length > 0) {
        // Calculate total ritase using deduplication logic (max ritase per date)
        const ritaseByDate = new Map();
        ritaseData.forEach(row => {
          const date = row.loading_date;
          const currentMax = ritaseByDate.get(date) || 0;
          if (row.ritase_rate && row.ritase_rate > currentMax) {
            ritaseByDate.set(date, row.ritase_rate);
          }
        });
        
        // Sum all max values - this represents the actual ritase for this vessel
        ritaseByDate.forEach(value => {
          ritaseRatesTotal += value;
        });
        
      }
    }
    
    const { data, error } = await supabase
      .from("vessel_status")
      .upsert({
        vessel_name: uniqueVesselName,
        base_vessel_name: vesselName,
        month_year: monthYear,
        status: status,
        ritase_rates_total: ritaseRatesTotal
      }, { onConflict: 'vessel_name,month_year' })
      .select();

    if (error) {
      return NextResponse.json({ message: "Database error", details: error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ data: [] });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("monthYear");

    if (!monthYear) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("vessel_status")
      .select(`
        *,
        vessel_details!vessel_status_base_vessel_name_month_year_fkey(
          buyer,
          rencana_muat,
          commenced_loading_date,
          commenced_loading_time
        )
      `)
      .eq("month_year", monthYear);

    // Flatten vessel_details into each row for easy consumption
    const enriched = (data || []).map((row: any) => {
      const detail = Array.isArray(row.vessel_details)
        ? row.vessel_details[0]
        : row.vessel_details;
      return {
        ...row,
        buyer: detail?.buyer ?? null,
        rencana_muat: detail?.rencana_muat ?? null,
        commenced_loading_date: detail?.commenced_loading_date ?? null,
        commenced_loading_time: detail?.commenced_loading_time ?? null,
        vessel_details: undefined,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error) {
    return NextResponse.json({ data: [] });
  }
}

export async function DELETE(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ message: "Database not available" }, { status: 500 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const vesselName = searchParams.get("vesselName");
    const monthYear = searchParams.get("monthYear");
    const vesselSequence = searchParams.get("vesselSequence");

    if (!vesselName || !monthYear) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const sequence = vesselSequence ? parseInt(vesselSequence) : 1;
    const uniqueVesselName = sequence > 1 ? `${vesselName}_seq${sequence}` : vesselName;

    const { error } = await supabase
      .from("vessel_status")
      .delete()
      .eq("vessel_name", uniqueVesselName)
      .eq("month_year", monthYear);

    if (error) {
      return NextResponse.json({ message: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}