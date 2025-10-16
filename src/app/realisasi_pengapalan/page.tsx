"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/sidebar";
import { useAuth } from "@/app/providers/auth_provider";
import { useRouter } from "next/navigation";

interface DailyMetricRow {
  id: number;
  record_date: string;
  total_realisasi: number;
  target: number;
  stock_awal: number;
  produksi_mining?: number;
  produksi_qc?: number;
  penjualan: number;
  vessel_complete?: number;
  created_at: string;
}

interface TableDisplayData {
  bulan: string;
  totalRealisasi: string;
  target: string;
  stockAwal: string;
  produksiMining: string;
  produksiQc: string;
  penjualan: string;
  vesselComplete: string;
  numericTarget?: number;
}

export default function RealisasiPengapalanPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TableDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isShipping, setIsShipping] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTargetValue, setEditTargetValue] = useState<string>("");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const thisYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(thisYear);
  //tes2
  useEffect(() => {
    try {
      const root = user as unknown as Record<string, unknown> | null;
      const am = root?.["app_metadata"] as Record<string, unknown> | undefined;
      const um = root?.["user_metadata"] as Record<string, unknown> | undefined;
      const ra = root?.["raw_app_meta_data"] as
        | Record<string, unknown>
        | undefined;
      const rm = root?.["raw_user_meta_data"] as
        | Record<string, unknown>
        | undefined;
      const bureu =
        typeof am?.["bureu"] === "string"
          ? (am?.["bureu"] as string)
          : typeof um?.["bureu"] === "string"
          ? (um?.["bureu"] as string)
          : typeof ra?.["bureu"] === "string"
          ? (ra?.["bureu"] as string)
          : typeof rm?.["bureu"] === "string"
          ? (rm?.["bureu"] as string)
          : null;
      setIsShipping((bureu || "").toLowerCase() === "shipping");
    } catch {
      setIsShipping(false);
    }
  }, [user]);

  const format3 = (n: number) =>
    n.toLocaleString("en-US", {
      useGrouping: true,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  const formatInt = (n: number) =>
    n.toLocaleString("en-US", {
      useGrouping: true,
      maximumFractionDigits: 0,
    });

  // Input helpers (US style): thousand ',' and decimal '.', live-grouping with caret preserved
  const formatUsGroupedTyping = (raw: string): string => {
    let s = String(raw || "").replace(/[^0-9.,]/g, "");
    if (!s) return "";
    // keep a single decimal point; treat '.' as decimal
    const endsWithDot = s.endsWith(".");
    s = s.replace(/,/g, "");
    const firstDot = s.indexOf(".");
    let intRaw = s;
    let fracRaw = "";
    if (firstDot !== -1) {
      intRaw = s.slice(0, firstDot);
      fracRaw = s.slice(firstDot + 1);
    }
    let intDigits = intRaw.replace(/\D/g, "");
    const fracDigits = fracRaw.replace(/\D/g, "").slice(0, 3);
    if (!intDigits && (endsWithDot || fracDigits.length > 0)) intDigits = "0";
    const groupedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (endsWithDot && fracDigits.length === 0) return `${groupedInt}.`;
    return fracDigits ? `${groupedInt}.${fracDigits}` : groupedInt;
  };
  const parseGroupedDecimal = (s: string): number => {
    const cleaned = String(s || "").replace(/,/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const computeCaretFromDigitsLeft = (
    formatted: string,
    digitsLeft: number
  ): number => {
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        seen++;
        if (seen === digitsLeft) return i + 1;
      }
    }
    return formatted.length;
  };
  const targetInputRef = useRef<HTMLInputElement>(null);

  const readBody = async (res: Response) => {
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json"))
        return { type: "json", value: await res.json() };
      const text = await res.text();
      return text && text.trim().length > 0
        ? { type: "text", value: text }
        : { type: "empty", value: null };
    } catch {
      return { type: "empty", value: null };
    }
  };

  const fetchRealisasiData = async (year: number, monthIndex0: number) => {
    const mm = String(monthIndex0 + 1).padStart(2, "0");
    const ym = `${year}-${mm}`;
    try {
      const res = await fetch(
        `/api/realisasi?monthYear=${encodeURIComponent(ym)}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      if (res.ok) {
        const response = await res.json();
        const data = response.data || {};
        return {
          totalRealisasi: data.totalRitase || 0,
          penjualan: data.totalRitase || 0,
          vesselComplete: data.debug?.completedVesselsCount || 0,
        };
      }
    } catch {
      // ignore error
    }
    return { totalRealisasi: 0, penjualan: 0, vesselComplete: 0 };
  };

  const fetchMonth = async (year: number, monthIndex0: number) => {
    const mm = String(monthIndex0 + 1).padStart(2, "0");
    const ym = `${year}-${mm}`;
    const res = await fetch(
      `/api/daily-operations?month=${encodeURIComponent(ym)}`,
      {
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) {
      const body = await readBody(res);
      const msg =
        body.type === "json"
          ? (body.value as { message?: string }).message || `HTTP ${res.status}`
          : body.type === "text"
          ? String(body.value)
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    const data = (await res.json()) as DailyMetricRow[];

    // Get realisasi data from realisasi APIa
    const realisasiData = await fetchRealisasiData(year, monthIndex0);

    // Tentukan Stock Awal:
    // Selalu ambil stock_awal terakhir (tanggal terbesar) dari bulan sebelumnya
    // Hitung prev month/year
    const prevMonthIndex0 = (monthIndex0 + 11) % 12;
    const prevYear = monthIndex0 === 0 ? year - 1 : year;
    const prevMm = String(prevMonthIndex0 + 1).padStart(2, "0");
    const prevYm = `${prevYear}-${prevMm}`;
    let lastPrevStockAwal = 0;
    try {
      const prevRes = await fetch(
        `/api/daily-operations?month=${encodeURIComponent(prevYm)}`,
        { headers: { Accept: "application/json" } }
      );
      if (prevRes.ok) {
        const prevData = (await prevRes.json()) as DailyMetricRow[];
        // Cari record dengan tanggal terbesar (YYYY-MM-DD lexicographic) yang punya angka stock_awal
        let latestDate = "";
        let latestValue = 0;
        for (const row of prevData) {
          const d = row.record_date || "";
          const val = (row as any).stock_awal as number | undefined;
          if (typeof val === "number") {
            if (d > latestDate) {
              latestDate = d;
              latestValue = val;
            }
          }
        }
        lastPrevStockAwal = latestValue || 0;
      }
    } catch {
      // abaikan error prev month, default 0
      lastPrevStockAwal = 0;
    }

    // Ambil target bulanan sebagai salah satu nilai target harian (bukan penjumlahan)
    const firstWithTarget = data.find((r) => typeof r.target === "number");
    const target = firstWithTarget?.target ?? 0;
    const stockAwal = lastPrevStockAwal;
    const produksiMining = data.reduce(
      (s, r) => s + (r.produksi_mining ?? 0),
      0
    );
    const produksiQc = data.reduce((s, r) => s + (r.produksi_qc ?? 0), 0);

    return {
      bulan: monthNames[monthIndex0],
      totalRealisasi: `${format3(realisasiData.totalRealisasi)} WMT`,
      target: `${format3(target)} WMT`,
      stockAwal: `${format3(stockAwal)} WMT`,
      produksiMining: `${format3(produksiMining)} WMT`,
      produksiQc: `${format3(produksiQc)} WMT`,
      penjualan: `${format3(realisasiData.penjualan)} WMT`,
      vesselComplete: formatInt(realisasiData.vesselComplete),
      numericTarget: target,
    } as TableDisplayData;
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const promises: Promise<TableDisplayData>[] = [];
        for (let i = 0; i < 12; i++) promises.push(fetchMonth(selectedYear, i));
        const results = await Promise.allSettled(promises);
        const aggregated: TableDisplayData[] = results.map((r, i) => {
          if (r.status === "fulfilled") return r.value;
          return {
            bulan: monthNames[i],
            totalRealisasi: "-",
            target: "-",
            stockAwal: "-",
            produksiMining: "-",
            produksiQc: "-",
            penjualan: "-",
            vesselComplete: "-",
          };
        });
        setRows(aggregated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data.");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [selectedYear]);

  const handleTabChange = (tab: string) => {
    // Tab change handler
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data operasional harian...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        <Sidebar onTabChange={handleTabChange} />
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-lg font-medium"
                  style={{ color: "#0075cf" }}
                >
                  Data Operasional Harian (Tahun {selectedYear})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Tahun:</span>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedYear}
                    onChange={(e) =>
                      setSelectedYear(parseInt(e.target.value, 10))
                    }
                  >
                    {Array.from({ length: 5 }, (_, k) => thisYear - 2 + k).map(
                      (y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Bulan
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Total Realisasi
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#273240" }}
                      >
                        Target
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#114771" }}
                      >
                        Stock Awal
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Produksi (Mining)
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Produksi (QC)
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#273240" }}
                      >
                        Penjualan
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#114771" }}
                      >
                        Vessel Complete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((row, idx) => (
                      <tr key={row.bulan} className="hover:bg-gray-50">
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#0075cf" }}
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/realisasi_pengapalan/${selectedYear}-${String(
                                  idx + 1
                                ).padStart(2, "0")}`
                              )
                            }
                            className="hover:underline hover:text-blue-800 transition-colors"
                          >
                            {row.bulan}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.totalRealisasi}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {isShipping && editingIndex === idx ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                className="border rounded px-2 py-1 text-sm"
                                value={editTargetValue}
                                ref={targetInputRef}
                                onChange={(e) => {
                                  const el = e.target as HTMLInputElement;
                                  const raw = el.value;
                                  const caret = el.selectionStart ?? raw.length;
                                  const digitsLeft = raw
                                    .slice(0, caret)
                                    .replace(/\D/g, "").length;
                                  const formatted = formatUsGroupedTyping(raw);
                                  setEditTargetValue(formatted);
                                  requestAnimationFrame(() => {
                                    const input = targetInputRef.current;
                                    if (!input) return;
                                    const newCaret = computeCaretFromDigitsLeft(
                                      formatted,
                                      digitsLeft
                                    );
                                    input.setSelectionRange(newCaret, newCaret);
                                  });
                                }}
                                onBlur={() => {
                                  const parsed =
                                    parseGroupedDecimal(editTargetValue);
                                  setEditTargetValue(
                                    parsed.toLocaleString("en-US", {
                                      useGrouping: true,
                                      minimumFractionDigits: 3,
                                      maximumFractionDigits: 3,
                                    })
                                  );
                                }}
                              />
                              <button
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                onClick={async () => {
                                  const mm = String(idx + 1).padStart(2, "0");
                                  const ym = `${selectedYear}-${mm}`;
                                  const parsed =
                                    parseGroupedDecimal(editTargetValue);
                                  if (!Number.isFinite(parsed)) return;
                                  try {
                                    const res = await fetch(
                                      "/api/daily-operations",
                                      {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Accept: "application/json",
                                          "x-bureu": "shipping",
                                        },
                                        credentials: "include",
                                        body: JSON.stringify({
                                          month: ym,
                                          target: parsed,
                                        }),
                                      }
                                    );
                                    if (!res.ok) {
                                      const b = await res
                                        .json()
                                        .catch(() => ({}));
                                      throw new Error(
                                        (b as any).message ||
                                          `HTTP ${res.status}`
                                      );
                                    }
                                    setRows((prev) =>
                                      prev.map((r, i) =>
                                        i === idx
                                          ? {
                                              ...r,
                                              target: `${format3(parsed)} WMT`,
                                              numericTarget: parsed,
                                            }
                                          : r
                                      )
                                    );
                                    setEditingIndex(null);
                                  } catch (e) {
                                    // eslint-disable-next-line no-alert
                                    alert(
                                      e instanceof Error
                                        ? e.message
                                        : "Gagal menyimpan target"
                                    );
                                  }
                                }}
                              >
                                Simpan
                              </button>
                              <button
                                className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs"
                                onClick={() => setEditingIndex(null)}
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{row.target}</span>
                              {isShipping && (
                                <button
                                  className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs"
                                  onClick={() => {
                                    setEditingIndex(idx);
                                    setEditTargetValue(
                                      (row.numericTarget ?? 0).toLocaleString(
                                        "en-US",
                                        {
                                          useGrouping: true,
                                          minimumFractionDigits: 3,
                                          maximumFractionDigits: 3,
                                        }
                                      )
                                    );
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.stockAwal}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.produksiMining}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.produksiQc}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.penjualan}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.vesselComplete}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
