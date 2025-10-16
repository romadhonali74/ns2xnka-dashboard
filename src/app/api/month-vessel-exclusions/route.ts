import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

type VesselObj = { vessel_name: string };
type ExclusionRow = {
	id: string | number;
	month_year: string;
	vessel_id: string | number;
	vessels: VesselObj | VesselObj[] | null;
};

function isVesselObj(value: unknown): value is VesselObj {
	return typeof value === "object" && value !== null && typeof (value as { vessel_name?: unknown }).vessel_name === "string";
}
function isExclusionRow(value: unknown): value is ExclusionRow {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	const vf = v.vessels as unknown;
	const vesselsOk = vf === null || isVesselObj(vf) || (Array.isArray(vf) && (vf.length === 0 || isVesselObj(vf[0])));
	return (
		(typeof v.id === "string" || typeof v.id === "number") &&
		typeof v.month_year === "string" &&
		(typeof v.vessel_id === "string" || typeof v.vessel_id === "number") &&
		vesselsOk
	);
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const monthYear = searchParams.get("monthYear");
		if (!monthYear) return NextResponse.json({ message: "monthYear is required" }, { status: 400 });
		if (!/^\d{4}-\d{2}$/.test(monthYear)) return NextResponse.json({ message: "Invalid monthYear" }, { status: 400 });

		const supabase = await createServerSupabaseClient();
		const { data, error } = await supabase
			.from("month_vessel_exclusions")
			.select("id, month_year, vessel_id, vessels(vessel_name)")
			.eq("month_year", monthYear);
		if (error) return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });
		if (!Array.isArray(data)) return NextResponse.json({ message: "Invalid data" }, { status: 500 });

		const rows: ExclusionRow[] = data.filter(isExclusionRow);
		const excludedVessels = Array.from(
			new Set(
				rows.flatMap((r) =>
					r.vessels == null
						? []
						: Array.isArray(r.vessels)
						? r.vessels.map((x) => x?.vessel_name).filter((n): n is string => typeof n === "string")
						: [r.vessels.vessel_name]
				)
			)
		);
		return NextResponse.json({ monthYear, excludedVessels });
	} catch {
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { monthYear: string; vesselName: string };
		const { monthYear, vesselName } = body;
		if (!monthYear || !vesselName) return NextResponse.json({ message: "monthYear and vesselName are required" }, { status: 400 });
		if (!/^\d{4}-\d{2}$/.test(monthYear)) return NextResponse.json({ message: "Invalid monthYear" }, { status: 400 });

		const supabase = await createServerSupabaseClient();
		const { data: vessel, error: vErr } = await supabase.from("vessels").select("id").eq("vessel_name", vesselName).single();
		if (vErr || !vessel) return NextResponse.json({ message: "Vessel not found", details: vErr?.message }, { status: 404 });

		const { error: insErr } = await supabase
			.from("month_vessel_exclusions")
			.upsert({ month_year: monthYear, vessel_id: vessel.id, created_at: new Date().toISOString() }, { onConflict: "month_year,vessel_id" });
		if (insErr) return NextResponse.json({ message: "Database error", details: insErr.message }, { status: 500 });

		return NextResponse.json({ message: "Excluded for month", monthYear, vesselName });
	} catch {
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const body = (await request.json()) as { monthYear: string; vesselName: string };
		const { monthYear, vesselName } = body;
		if (!monthYear || !vesselName) return NextResponse.json({ message: "monthYear and vesselName are required" }, { status: 400 });
		if (!/^\d{4}-\d{2}$/.test(monthYear)) return NextResponse.json({ message: "Invalid monthYear" }, { status: 400 });

		const supabase = await createServerSupabaseClient();
		const { data: vessel, error: vErr } = await supabase.from("vessels").select("id").eq("vessel_name", vesselName).single();
		if (vErr || !vessel) return NextResponse.json({ message: "Vessel not found", details: vErr?.message }, { status: 404 });

		const { error: delErr } = await supabase
			.from("month_vessel_exclusions")
			.delete()
			.eq("month_year", monthYear)
			.eq("vessel_id", vessel.id);
		if (delErr) return NextResponse.json({ message: "Database error", details: delErr.message }, { status: 500 });

		return NextResponse.json({ message: "Restored for month", monthYear, vesselName });
	} catch {
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}