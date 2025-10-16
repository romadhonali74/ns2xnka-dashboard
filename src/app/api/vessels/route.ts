import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../lib/supabase";
import { Vessel } from "@/app/lib/type";


export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: vessels, error } = await supabase
      .from("vessels")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase error fetching vessels:", error);
      return NextResponse.json(
        { message: "Failed to fetch vessels", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(vessels as Vessel[]);
  } catch (error) {
    console.error("Error fetching vessels:", error);
    return NextResponse.json(
      { message: "Failed to fetch vessels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Support bulk and single
    const items: Array<{ vessel_name: string; vessel_code?: string | null }> = Array.isArray(body)
      ? body
      : [{ vessel_name: body?.vessel_name, vessel_code: body?.vessel_code }];
    // Validate
    if (!items.every((it) => typeof it.vessel_name === 'string' && it.vessel_name.trim().length > 0)) {
      return NextResponse.json(
        { message: "Vessel name is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const payload = items.map((it) => ({ vessel_name: it.vessel_name.trim(), vessel_code: it.vessel_code ?? null }));
    const { data: newVessel, error } = await supabase
      .from("vessels")
      .upsert(payload, { onConflict: 'vessel_name' })
      .select();

    if (error) {
      console.error("Supabase error adding vessel:", error);
      return NextResponse.json(
        { message: "Failed to add vessel", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newVessel as Vessel[], { status: 201 });
  } catch (error) {
    console.error("Error adding vessel:", error);
    return NextResponse.json(
      { message: "Failed to add vessel" },
      { status: 500 }
    );
  }
}