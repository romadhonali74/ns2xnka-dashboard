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
    console.log('Restoring vessel names with seq...');

    // Restore vessel_status records - add back _seq suffix based on vessel_sequence
    const { data: statusRecords } = await supabase
      .from('vessel_status')
      .select('id, vessel_name, vessel_sequence')
      .not('vessel_sequence', 'is', null);

    if (statusRecords) {
      for (const record of statusRecords) {
        if (!record.vessel_name.includes('_seq')) {
          const newName = `${record.vessel_name}_seq${record.vessel_sequence}`;
          await supabase
            .from('vessel_status')
            .update({ vessel_name: newName })
            .eq('id', record.id);
        }
      }
      console.log(`Restored ${statusRecords.length} vessel_status records`);
    }

    return NextResponse.json({ 
      message: "Vessel name restoration completed",
      statusRestored: statusRecords?.length || 0
    });

  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}