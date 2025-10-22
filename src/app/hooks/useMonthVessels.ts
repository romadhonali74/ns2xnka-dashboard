import useSWR from 'swr';

type MonthEntry = { name: string; seq: number; display_order?: number };

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return (await res.json()) as MonthEntry[];
};

export function useMonthVessels(monthYear: string) {
  const { data, error, isLoading, mutate } = useSWR<MonthEntry[]>(
    monthYear ? `/api/month-vessels?monthYear=${monthYear}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  // expose entries (name + seq + display_order)
  return { entries: data || [], loading: isLoading, error: error ? (error as Error).message : null, mutate };
}


