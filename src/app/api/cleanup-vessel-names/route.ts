import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function POST() {
  if (!supabase) {
    return NextResponse.json({ error: "No supabase client available" }, { status: 500 });
  }

  try {


    // Get all vessel_status records with _seq
    const { data: statusRecords } = await supabase
      .from('vessel_status')
      .select('id, vessel_name')
      .like('vessel_name', '%_seq%');

    // Update each record
    if (statusRecords) {
      for (const record of statusRecords) {
        const cleanName = record.vessel_name.split('_seq')[0];
        await supabase
          .from('vessel_status')
          .update({ vessel_name: cleanName })
          .eq('id', record.id);
      }

    }

    // Get all vessel_details records with _seq
    const { data: detailsRecords } = await supabase
      .from('vessel_details')
      .select('id, vessel_name')
      .like('vessel_name', '%_seq%');

    // Update each record
    if (detailsRecords) {
      for (const record of detailsRecords) {
        const cleanName = record.vessel_name.split('_seq')[0];
        await supabase
          .from('vessel_details')
          .update({ vessel_name: cleanName })
          .eq('id', record.id);
      }

    }

    return NextResponse.json({ 
      message: "Vessel name cleanup completed",
      statusUpdated: statusRecords?.length || 0,
      detailsUpdated: detailsRecords?.length || 0
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}