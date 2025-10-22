import useSWR, { type Key } from "swr";

type ShiftCell = { loadingRate: number | null; ritaseRate: number | null };
export type MonthlyLoadingData = Record<string, Record<string, Record<number, { vesselId: number | null; s1: ShiftCell; s2: ShiftCell }>>>;

const fetcher: (url: string) => Promise<MonthlyLoadingData> = async (url) => {
	const res = await fetch(url);
	const contentType = res.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		const text = await res.text();
		throw new Error(`Unexpected content-type: ${contentType}. Body: ${text.slice(0, 200)}`);
	}
	if (!res.ok) {
		const body = (await res.json().catch(() => undefined)) as { message?: string } | undefined;
		throw new Error(body?.message ?? `Request failed with status ${res.status}`);
	}
	return (await res.json()) as MonthlyLoadingData;
};

export function useLoadingData(monthYear: string) {
	const key: Key = monthYear ? `/api/loading-ritase-rates?monthYear=${monthYear}` : null;
	const { data, error, isLoading, mutate } = useSWR<MonthlyLoadingData>(key, fetcher, {
		revalidateOnFocus: false,
	});
	return {
		data,
		loading: isLoading,
		error: error ? (error as Error).message : null,
		mutate,
	};
}