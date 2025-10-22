// app/api/significant-issues/[issueNo]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";

// Helper untuk ekstrak issueNo dari URL
function extractIssueId(req: NextRequest): number | null {
  const issueNo = req.nextUrl.pathname.split("/").pop();
  const issueId = Number.parseInt(issueNo || "");
  return isNaN(issueId) ? null : issueId;
}

export async function GET(req: NextRequest) {
  const issueId = extractIssueId(req);
  if (!issueId) {
    return NextResponse.json({ message: "Invalid issue number" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: issue, error } = await supabase
      .from("significant_issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ message: "Significant issue not found" }, { status: 404 });
      }
      console.error("Supabase error fetching issue by ID:", error);
      return NextResponse.json({ message: "Failed to fetch issue", details: error.message }, { status: 500 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching significant issue by ID:", error);
    return NextResponse.json({ message: "Failed to fetch issue" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const issueId = extractIssueId(req);
  if (!issueId) {
    return NextResponse.json({ message: "Invalid issue number" }, { status: 400 });
  }

  try {
    const updatedFields = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: updatedIssue, error } = await supabase
      .from("significant_issues")
      .update(updatedFields)
      .eq("id", issueId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ message: "Issue not found" }, { status: 404 });
      }
      console.error("Supabase error updating issue:", error);
      return NextResponse.json({ message: "Failed to update", details: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ message: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const issueId = extractIssueId(req);
  if (!issueId) {
    return NextResponse.json({ message: "Invalid issue number" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("significant_issues")
      .delete()
      .eq("id", issueId);

    if (error) {
      console.error("Supabase error deleting issue:", error);
      return NextResponse.json({ message: "Failed to delete", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Significant issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json({ message: "Failed to delete issue" }, { status: 500 });
  }
}
