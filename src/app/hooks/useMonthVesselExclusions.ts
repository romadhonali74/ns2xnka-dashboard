import useSWR, { type Key } from "swr";

export type MonthExclusionsResponse = { monthYear: string; excludedVessels: string[] };

const fetcher: (url: string) => Promise<MonthExclusionsResponse> = async (url) => {
	const res = await fetch(url);
	const ct = res.headers.get("content-type") ?? "";
	if (!ct.includes("application/json")) {
		const t = await res.text();
		throw new Error(`Unexpected content-type: ${ct}. Body: ${t.slice(0, 200)}`);
	}
	if (!res.ok) {
		const body = (await res.json().catch(() => undefined)) as { message?: string } | undefined;
		throw new Error(body?.message ?? `Request failed with status ${res.status}`);
	}
	return (await res.json()) as MonthExclusionsResponse;
};

export function useMonthVesselExclusions(monthYear: string) {
	const key: Key = monthYear ? `/api/month-vessel-exclusions?monthYear=${monthYear}` : null;
	const { data, error, isLoading, mutate } = useSWR<MonthExclusionsResponse>(key, fetcher, {
		revalidateOnFocus: false,
	});
	return {
		excluded: data?.excludedVessels ?? [],
		loading: isLoading,
		error: error ? (error as Error).message : null,
		mutate,
	};
}