import { createServerSupabaseClient } from "@/app/lib/supabase";
import { Vessel } from "@/app/lib/type";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  context: any
) {
  try {
    const { params } = context as { params: { id: string } };
    const { id } = params;
    const { vessel_name, vessel_code, status } = await request.json();

    const supabase = await createServerSupabaseClient();
    const { data: updatedVessel, error } = await supabase
      .from("vessels")
      .update({ 
        vessel_name, 
        vessel_code, 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating vessel:", error);
      return NextResponse.json(
        { message: "Failed to update vessel", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedVessel as Vessel);
  } catch (error) {
    console.error("Error updating vessel:", error);
    return NextResponse.json(
      { message: "Failed to update vessel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  try {
    const { params } = context as { params: { id: string } };
    const { id } = params;

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("vessels")
      .update({ 
        status: "inactive", 
        updated_at: new Date().toISOString() 
      })
      .eq("id", parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error("Supabase error deleting vessel:", error);
      return NextResponse.json(
        { message: "Failed to delete vessel", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Vessel deleted successfully" });
  } catch (error) {
    console.error("Error deleting vessel:", error);
    return NextResponse.json(
      { message: "Failed to delete vessel" },
      { status: 500 }
    );
  }
}