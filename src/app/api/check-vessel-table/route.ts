import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("vessel_details")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message
      });
    }

    return NextResponse.json({
      exists: true,
      message: "Table exists"
    });
  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: "Failed to check table"
    });
  }
}