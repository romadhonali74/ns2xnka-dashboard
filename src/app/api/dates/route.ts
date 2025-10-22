import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Generate dates for February 2025 (as in the frontend)
    const dates: string[] = [];
    for (let i = 1; i <= 28; i++) {
      dates.push(`${i}-Feb-25`);
    }
    return NextResponse.json(dates);
  } catch (error) {
    console.error("Error generating dates:", error);
    return NextResponse.json(
      { message: "Failed to generate dates" },
      { status: 500 }
    );
  }
}