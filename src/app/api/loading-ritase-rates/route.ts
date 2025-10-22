import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

type VesselObj = { vessel_name: string };
type LoadingRitaseMonthRow = {
	loading_date: string;
	loading_rate: number | null;
	ritase_rate: number | null;
	shift?: number | null;
	vessels: VesselObj | VesselObj[] | null;
};

function isVesselObj(value: unknown): value is VesselObj {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { vessel_name?: unknown }).vessel_name === "string"
	);
}

function isMonthRow(value: unknown): value is LoadingRitaseMonthRow {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	const vField = v.vessels as unknown;
	const vesselsOk =
		vField === null ||
		isVesselObj(vField) ||
		(Array.isArray(vField) && (vField.length === 0 || isVesselObj(vField[0])));
	return (
		typeof v.loading_date === "string" &&
		(v.loading_rate === null || typeof v.loading_rate === "number") &&
		(v.ritase_rate === null || typeof v.ritase_rate === "number") &&
		vesselsOk
	);
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			date: string;
			vesselName: string;
			loadingRate: number | null;
			ritaseRate: number | null;
			shift?: number | null;
			monthVesselSeq?: number | null;
		};
		const { date, vesselName } = body;

		if (!date || !vesselName) {
			return NextResponse.json({ message: "Date and vessel name are required" }, { status: 400 });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return NextResponse.json({ message: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
		}

		// Validate numeric fields (allow null)
		const loadingRate =
			body.loadingRate == null ? null : Number.isFinite(body.loadingRate) ? body.loadingRate : null;
		const ritaseRate =
			body.ritaseRate == null ? null : Number.isFinite(body.ritaseRate) ? Math.round(body.ritaseRate * 1000) / 1000 : null;

		if (body.loadingRate !== null && loadingRate === null) {
			return NextResponse.json({ message: "Invalid loadingRate" }, { status: 400 });
		}
		if (body.ritaseRate !== null && ritaseRate === null) {
			return NextResponse.json({ message: "Invalid ritaseRate" }, { status: 400 });
		}

		const supabase = await createServerSupabaseClient();

		// Find vessel id
		const { data: vesselData, error: vesselError } = await supabase
			.from("vessels")
			.select("id")
			.eq("vessel_name", vesselName)
			.single();

		if (vesselError || !vesselData) {
			return NextResponse.json({ message: "Vessel not found", details: vesselError?.message }, { status: 404 });
		}

		const vesselId = vesselData.id;
		const monthYear = date.substring(0, 7);
		const shift = body.shift && (body.shift === 2 ? 2 : 1);

		// Require provided monthVesselSeq and validate it belongs to this month+vessel
		if (body.monthVesselSeq == null || !Number.isFinite(body.monthVesselSeq)) {
			return NextResponse.json({ message: "monthVesselSeq is required" }, { status: 400 });
		}
		const providedSeq = Math.max(1, Math.floor(body.monthVesselSeq));
		const { data: mv, error: mvErr } = await supabase
			.from("month_vessels")
			.select("seq")
			.eq("month_year", monthYear)
			.eq("vessel_id", vesselId)
			.eq("seq", providedSeq)
			.limit(1);
		if (mvErr || !Array.isArray(mv) || mv.length === 0) {
			return NextResponse.json({ message: "Invalid monthVesselSeq for this vessel and month" }, { status: 400 });
		}
		const monthVesselSeq = providedSeq;

		// Upsert
		const { error: upsertError } = await supabase
			.from("loading_ritase_rates")
			.upsert(
				{
					vessel_id: vesselId,
					loading_date: date,
					loading_rate: loadingRate,
					ritase_rate: ritaseRate,
					shift,
					month_year: monthYear,
					month_vessel_seq: monthVesselSeq,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "month_year,month_vessel_seq,loading_date,shift" }
			);

		if (upsertError) {
			return NextResponse.json({ message: "Database error", details: upsertError.message }, { status: 500 });
		}

		return NextResponse.json({ message: "Data saved successfully" });
	} catch {
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const monthYear = searchParams.get("monthYear");

		if (!monthYear) {
			return NextResponse.json({ message: "monthYear parameter is required" }, { status: 400 });
		}
		if (!/^\d{4}-\d{2}$/.test(monthYear)) {
			return NextResponse.json({ message: "Invalid monthYear format. Expected YYYY-MM" }, { status: 400 });
		}

		const supabase = await createServerSupabaseClient();
		// Ambil loading_ritase_rates + vessels (id, name) + seq
		const { data, error } = await supabase
			.from("loading_ritase_rates")
			.select(`
        loading_date,
        loading_rate,
        ritase_rate,
        shift,
        month_vessel_seq,
        vessels ( id, vessel_name )
      `)
			.eq("month_year", monthYear);

		if (error) {
			return NextResponse.json({ message: "Database error", details: error.message }, { status: 500 });
		}
		if (!Array.isArray(data)) {
			return NextResponse.json({ message: "Invalid data format from Supabase" }, { status: 500 });
		}

		// response: { [date]: { [vesselName]: { [seq]: { vesselId, s1:{}, s2:{} } } } }
		const result: Record<string, Record<string, Record<number, { vesselId: number | null; s1: { loadingRate: number | null; ritaseRate: number | null }; s2: { loadingRate: number | null; ritaseRate: number | null } }>>> = {};
		for (const row of data) {
			const date = (row as any).loading_date as string;
			const seq = (row as any).month_vessel_seq as number | null;
			const vField = (row as any).vessels as any;
			const vesselName = Array.isArray(vField) ? vField[0]?.vessel_name : vField?.vessel_name;
			const vesselId = Array.isArray(vField) ? vField[0]?.id ?? null : (vField?.id ?? null);
			if (!date || !vesselName || !Number.isFinite(seq as any)) continue;
			if (!result[date]) result[date] = {};
			if (!result[date][vesselName]) result[date][vesselName] = {} as any;
			if (!result[date][vesselName][seq!]) {
				result[date][vesselName][seq!] = {
					vesselId,
					s1: { loadingRate: null, ritaseRate: null },
					s2: { loadingRate: null, ritaseRate: null },
				};
			}
			const sh = (row as any).shift === 2 ? 's2' : 's1';
			(result[date][vesselName][seq!] as any)[sh] = {
				loadingRate: (row as any).loading_rate,
				ritaseRate: (row as any).ritase_rate,
			};
		}

		return NextResponse.json(result);
	} catch {
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}