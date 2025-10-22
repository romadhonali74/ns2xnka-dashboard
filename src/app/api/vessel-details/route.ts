import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST(request: NextRequest) {
  console.log('=== VESSEL DETAILS API START ===');
  
  if (!supabase) {
    console.error('Supabase client not initialized - missing environment variables');
    return NextResponse.json({ message: "Database configuration error" }, { status: 500 });
  }
  
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { vesselName, buyer, rencanaMuat, commencedLoadingDate, commencedLoadingTime, monthYear } = body;
    console.log('Extracted fields:', { vesselName, buyer, rencanaMuat, commencedLoadingDate, commencedLoadingTime, monthYear });

    if (!vesselName || !monthYear) {
      console.log('Validation failed: missing vesselName or monthYear');
      return NextResponse.json({ message: "Nama kapal dan bulan/tahun harus diisi" }, { status: 400 });
    }

    const payload = {
      vessel_name: vesselName,
      buyer: buyer || null,
      rencana_muat: rencanaMuat ? rencanaMuat.replace(/,/g, '') : null,
      commenced_loading_date: commencedLoadingDate || null,
      commenced_loading_time: commencedLoadingTime || null,
      month_year: monthYear
    };
    console.log('Database payload:', JSON.stringify(payload, null, 2));

    console.log('Attempting upsert...');
    const { data, error } = await supabase
      .from("vessel_details")
      .upsert(payload, { onConflict: 'vessel_name,month_year' })
      .select();

    if (error) {
      console.error('Database error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: "Database error", details: error }, { status: 500 });
    }

    console.log('Success! Data saved:', JSON.stringify(data, null, 2));
    console.log('=== VESSEL DETAILS API END ===');
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Exception:', error);
    console.log('=== VESSEL DETAILS API ERROR END ===');
    return NextResponse.json({ message: "Server error", details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('=== VESSEL DETAILS GET START ===');
  
  if (!supabase) {
    console.error('Supabase client not initialized for GET');
    return NextResponse.json({ data: null });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const vesselName = searchParams.get("vesselName");
    const monthYear = searchParams.get("monthYear");
    console.log('GET params:', { vesselName, monthYear });

    if (!vesselName || !monthYear) {
      console.log('GET: Missing params, returning null');
      return NextResponse.json({ data: null });
    }

    const { data, error } = await supabase
      .from("vessel_details")
      .select("*")
      .eq("vessel_name", vesselName)
      .eq("month_year", monthYear)
      .single();

    if (error) {
      console.log('GET error (might be normal if no data):', error.message);
    }
    
    console.log('GET result:', data);
    console.log('=== VESSEL DETAILS GET END ===');
    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('GET Exception:', error);
    return NextResponse.json({ data: null });
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

    if (!vesselName || !monthYear) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const { error } = await supabase
      .from("vessel_details")
      .delete()
      .eq("vessel_name", vesselName)
      .eq("month_year", monthYear);

    if (error) {
      return NextResponse.json({ message: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}