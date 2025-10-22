"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import Sidebar from "../components/sidebar";
import { format } from "date-fns"; // Untuk format tanggal
import { id as idLocale } from "date-fns/locale"; // Untuk nama bulan dalam Bahasa Indonesia
import { useAuth } from "../providers/auth_provider";
import AuthGuard from "../components/auth-guard";

// Loading component
// function LoadingScreen() {
//   return (
//     <div
//       className="min-h-screen flex items-center justify-center"
//       style={{ backgroundColor: "#f1f2f7" }}
//     >
//       <div className="text-center">
//         <div
//           className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
//           style={{ borderColor: "#0075cf" }}
//         ></div>
//         <p className="text-gray-600">Loading...</p>
//       </div>
//     </div>
//   );
// }

// Interfaces for fetched data
interface MonthlyRealisasiPengapalanMetric {
  month_str: string;
  month_name: string;
  total_realisasi_wmt: number;
  target_wmt: number;
  stock_awal_wmt: number;
  produksi_wmt: number;
  penjualan_wmt: number;
  total_kunjungan_count: number;
  truck_factor: number; // Dari fungsi get_monthly_realisasi_pengapalan
}

interface YTDRealisasiPengapalanMetric {
  remarks: string;
  plan_value: number;
  realisasi_progress: number;
  percentage: number;
}

// Interface for display
interface MetricCardData {
  title: string;
  value: string;
  color: string;
}

interface YTDTableData {
  remarks: string;
  plan2025: string;
  realisasiProgress: string;
  percentage: string;
}

// Interface for the monthly table data
interface TableDisplayData {
  bulan: string;
  totalRealisasi: string; // Format sebagai string dengan " WMT"
  target: string;
  stockAwal: string;
  produksi: string;
  penjualan: string;
  totalKunjungan: string; // Format sebagai string
}

interface CurveData {
  labels: string[];
  cumRealisasi: number[];
  cumTarget: number[];
}
interface SelectedTotals {
  totalRealisasi: number;
  target: number;
  stockAwal: number;
  produksi: number;
  produksiMining: number;
  produksiQc: number;
  penjualan: number;
  totalKunjungan: number;
  totalRitasePerKapal: number;
}

export default function Dashboard() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [monthlyData, setMonthlyData] = useState<
    MonthlyRealisasiPengapalanMetric[]
  >([]);
  const [ytdData, setYtdData] = useState<YTDRealisasiPengapalanMetric[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userBureu, setUserBureu] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState<number>(2025);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1); // Current month
  const [selectedTotals, setSelectedTotals] = useState<SelectedTotals>({ totalRealisasi: 0, target: 0, stockAwal: 0, produksi: 0, produksiMining: 0, produksiQc: 0, penjualan: 0, totalKunjungan: 0, totalRitasePerKapal: 0 });
  const [curveData, setCurveData] = useState<CurveData>({ labels: [], cumRealisasi: [], cumTarget: [] });
  const [totalsMode, setTotalsMode] = useState<'month' | 'yearTotals'>('month');
  const [curveYear, setCurveYear] = useState<number>(new Date().getFullYear());
  const [barYear, setBarYear] = useState<number>(new Date().getFullYear());
  const [barTotals, setBarTotals] = useState<{ stockAwal: number; produksiMining: number; produksiQc: number; penjualan: number }>({ stockAwal: 0, produksiMining: 0, produksiQc: 0, penjualan: 0 });
  const [ytdYearTotals, setYtdYearTotals] = useState<{ plan: number; real: number }>({ plan: 0, real: 0 });
  const [totalsLoading, setTotalsLoading] = useState<boolean>(false);
  const [curveLoading, setCurveLoading] = useState<boolean>(false);
  const [barLoading, setBarLoading] = useState<boolean>(false);
  const [ytdLoading, setYtdLoading] = useState<boolean>(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      setUserRole(metadata.role ?? null);
      const bureuMeta = (user as any)?.app_metadata?.bureu || (user as any)?.user_metadata?.bureu || (user as any)?.raw_app_meta_data?.bureu || (user as any)?.raw_user_meta_data?.bureu;
      setUserBureu(typeof bureuMeta === 'string' ? bureuMeta : null);
    }
  }, [user]);

  // useEffect(() => {
  //   if (!user) {
  //     router.push("/login");
  //   }
  // }, [router, user]);

  useEffect(() => {
    const fetchAllData = async () => {
      //setIsLoadingData(true);
      setError(null);
      try {
        // Fetch Monthly Data
        const monthlyResponse = await fetch("/api/realisasi-pengapalan");
        if (!monthlyResponse.ok) {
          const errData = await monthlyResponse.json();
          throw new Error(
            errData.message || `HTTP error! status: ${monthlyResponse.status}`
          );
        }
        const monthlyMetrics: MonthlyRealisasiPengapalanMetric[] =
          await monthlyResponse.json();
        setMonthlyData(monthlyMetrics);

        // Fetch YTD Data
        const ytdResponse = await fetch(
          "/api/realisasi-pengapalan/ytd-realisasi-pengapalan"
        );
        if (!ytdResponse.ok) {
          const errData = await ytdResponse.json();
          throw new Error(
            errData.message || `HTTP error! status: ${ytdResponse.status}`
          );
        }
        const ytdMetrics: YTDRealisasiPengapalanMetric[] =
          await ytdResponse.json();
        setYtdData(ytdMetrics);
      } catch (err: unknown) {
        console.error("Failed to fetch dashboard data:", err);
        if (err instanceof Error) {
          setError(err.message || "Gagal memuat data dashboard.");
        } else {
          setError("Gagal memuat data dashboard (unknown error).");
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchAllData();
  }, [isLoadingData]);

  // Helpers
  const fetchDailyMonth = async (ym: string) => {
    const res = await fetch(`/api/daily-operations?month=${encodeURIComponent(ym)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as any).message || `HTTP ${res.status}`);
    }
    return (await res.json()) as Array<{ record_date: string; total_realisasi: number; target: number; stock_awal: number; produksi_mining?: number; produksi_qc?: number; penjualan: number; vessel_complete?: number; created_at?: string; }>; // target sama sebulan
  };

  // Sum total ritase for a given month (YYYY-MM) based on vessel status
  const fetchMonthRitaseTotal = async (ym: string): Promise<number> => {
    try {
      const res = await fetch(`/api/realisasi?monthYear=${encodeURIComponent(ym)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        return 0;
      }
      const result = await res.json();
      return result.data?.totalRitase || 0;
    } catch (error) {
      return 0;
    }
  };

  // Count completed vessels for a given month (only vessels completed in that month)
  const fetchCompletedVesselsCount = async (ym: string): Promise<number> => {
    try {
      const res = await fetch(`/api/vessel-status?monthYear=${encodeURIComponent(ym)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) return 0;
      const result = await res.json();
      const completedVessels = result.data?.filter((v: any) => v.status === 'completed') || [];
      
      // Count only completed vessels in current month
      return completedVessels.length;
    } catch {
      return 0;
    }
  };

  // Count completed vessels for entire year
  const fetchCompletedVesselsCountForYear = async (year: number): Promise<number> => {
    let totalCompleted = 0;
    for (let m = 1; m <= 12; m++) {
      const ym = `${year}-${String(m).padStart(2, "0")}`;
      const monthCount = await fetchCompletedVesselsCount(ym);
      totalCompleted += monthCount;
    }
    return totalCompleted;
  };

  // (curve builders removed)

  // Compute totals for cards/donut based on filters (month/year)
  const computeTotalsMonth = async (year: number, month: number) => {
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    const days = await fetchDailyMonth(ym);
    const totalRitasePerKapal = await fetchMonthRitaseTotal(ym);
    const monthTarget = days.find((d) => typeof d.target === "number")?.target ?? 0;
    // Stock Awal untuk kartu Home: ambil nilai stock_awal dari akhir bulan sebelumnya
    let stockAwal = 0;
    const prev = new Date(year, month - 1, 1);
    prev.setMonth(prev.getMonth() - 1);
    const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    
    try {
      const prevDays = await fetchDailyMonth(prevYm);
      const prevLastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
      
      // Cari stock_awal dari tanggal terakhir bulan sebelumnya, mundur jika tidak ada
      for (let day = prevLastDay; day >= 1; day--) {
        const checkDate = `${prevYm}-${String(day).padStart(2, "0")}`;
        const dayData = prevDays.find(d => d.record_date === checkDate);
        if (dayData && typeof dayData.stock_awal === 'number' && dayData.stock_awal > 0) {
          stockAwal = dayData.stock_awal;
          break;
        }
      }
    } catch {
      stockAwal = 0;
    }
    const produksiMining = days.reduce((s, r) => s + (r.produksi_mining ?? 0), 0);
    const produksiQc = days.reduce((s, r) => s + (r.produksi_qc ?? 0), 0);
    const produksi = produksiMining + produksiQc;
    const penjualan = totalRitasePerKapal; // penjualan = realisasi
    // Count completed vessels from vessel_status instead of daily operations
    const completedVesselsCount = await fetchCompletedVesselsCount(ym);
    const newTotals = { totalRealisasi: totalRitasePerKapal, target: monthTarget, stockAwal, produksi, produksiMining, produksiQc, penjualan, totalKunjungan: completedVesselsCount, totalRitasePerKapal };
    setSelectedTotals(newTotals);
  };

  const computeTotalsYear = async (year: number) => {
    let sumR = 0, sumT = 0, sumS = 0, sumPM = 0, sumPQ = 0, sumJ = 0, sumV = 0;
    
    // Use vessel-status-total API for accurate yearly realisasi and penjualan
    try {
      const res = await fetch(`/api/vessel-status-total?year=${year}`, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const result = await res.json();
        sumR = result.data?.total || 0;
        sumJ = result.data?.total || 0; // penjualan = realisasi
      }
    } catch {
      sumR = 0;
      sumJ = 0;
    }
    
    // Get stock awal from last filled date in December of previous year (same as chart)
    try {
      const prevYear = year - 1;
      const decemberYm = `${prevYear}-12`;
      const decDays = await fetchDailyMonth(decemberYm);
      let latestTs = -Infinity;
      for (const d of decDays) {
        const val = d.stock_awal as number | undefined;
        if (typeof val === 'number') {
          const createdAt = (d as any).created_at ?? d.record_date;
          const ts = createdAt ? new Date(createdAt).getTime() : 0;
          if (Number.isFinite(ts) && ts >= latestTs) {
            latestTs = ts;
            sumS = val;
          }
        }
      }
    } catch {
      sumS = 0;
    }
    
    for (let m = 1; m <= 12; m++) {
      try {
        const ym = `${year}-${String(m).padStart(2, "0")}`;
        const days = await fetchDailyMonth(ym);
        let tgt = 0;
        // akumulasi untuk produksi dari daily operations
        for (const d of days) {
          tgt = d.target ?? tgt;
          sumPM += (d.produksi_mining ?? 0);
          sumPQ += (d.produksi_qc ?? 0);
        }
        sumT += tgt;
      } catch {
        // ignore per-bulan
      }
    }
    const sumP = sumPM + sumPQ;
    // Count completed vessels for the year
    const yearCompletedCount = await fetchCompletedVesselsCountForYear(year);
    setSelectedTotals({ totalRealisasi: sumR, target: sumT, stockAwal: sumS, produksi: sumP, produksiMining: sumPM, produksiQc: sumPQ, penjualan: sumJ, totalKunjungan: yearCompletedCount, totalRitasePerKapal: sumR });
  };

  // Independent yearly totals for the right bar chart (not affected by global filters)
  const buildBarYearTotals = async (year: number) => {
    let sumS = 0, sumPM = 0, sumPQ = 0;
    
    // Use vessel-status-total API for accurate penjualan calculation
    let sumJ = 0;
    try {
      const res = await fetch(`/api/vessel-status-total?year=${year}`, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const result = await res.json();
        sumJ = result.data?.total || 0;
      }
    } catch {
      sumJ = 0;
    }
    
    for (let m = 1; m <= 12; m++) {
      try {
        const ym = `${year}-${String(m).padStart(2, '0')}`;
        const days = await fetchDailyMonth(ym);
        // produksi dijumlah harian
        for (const d of days) {
          sumPM += (d.produksi_mining ?? 0);
          sumPQ += (d.produksi_qc ?? 0);
        }
        // Skip stock calculation for individual months
      } catch {
        // ignore
      }
    }
    
    // Get stock awal from last filled date in December of previous year
    let stockAwal = 0;
    try {
      const prevYear = year - 1;
      const decemberYm = `${prevYear}-12`;
      const decDays = await fetchDailyMonth(decemberYm);
      let latestTs = -Infinity;
      for (const d of decDays) {
        const val = d.stock_awal as number | undefined;
        if (typeof val === 'number') {
          const createdAt = (d as any).created_at ?? d.record_date;
          const ts = createdAt ? new Date(createdAt).getTime() : 0;
          if (Number.isFinite(ts) && ts >= latestTs) {
            latestTs = ts;
            stockAwal = val;
          }
        }
      }
    } catch {
      stockAwal = 0;
    }
    
    setBarTotals({ stockAwal: stockAwal, produksiMining: sumPM, produksiQc: sumPQ, penjualan: sumJ });
  };

  useEffect(() => {
    (async () => {
      try {
        setTotalsLoading(true);
        if (totalsMode === 'yearTotals') {
          await computeTotalsYear(filterYear);
        } else {
          await computeTotalsMonth(filterYear, filterMonth);
        }
      } catch (e) {
        // ignore silently in totals block, main error UI handled elsewhere
      } finally {
        setTotalsLoading(false);
      }
    })();
  }, [filterYear, filterMonth, totalsMode]);

  // (curve display removed)

  // if (!user) return null;

  // const metadata = user.user_metadata;

  // Fungsi untuk menentukan activeTab berdasarkan pathname
  const handleTabChange = (tab: string) => {
    // Tab change handler
  };

  // Helpers: number formatting for metric cards
  const format3 = (n: number) =>
    n.toLocaleString("en-US", {
      useGrouping: true,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  const formatInt = (n: number) =>
    n.toLocaleString("en-US", { useGrouping: true, maximumFractionDigits: 0 });

  // --- Data Transformation untuk Metrics Cards ---
  const metrics: MetricCardData[] = [
    { title: "Total Realisasi", value: `${format3(selectedTotals.totalRitasePerKapal)} WMT`, color: "#92d050" },
    { title: "Target", value: `${format3(selectedTotals.target)} WMT`, color: "#ffd966" },
    { title: "Stock Awal", value: `${format3(selectedTotals.stockAwal)} WMT`, color: "#4472c4" },
    { title: "Produksi Mining", value: `${format3(selectedTotals.produksiMining)} WMT`, color: "#70ad47" },
    { title: "Produksi QC", value: `${format3(selectedTotals.produksiQc)} WMT`, color: "#8e7cc3" },
    { title: "Penjualan", value: `${format3(selectedTotals.penjualan)} WMT`, color: "#ffd966" },
    { title: "Total Completed Kapal", value: formatInt(selectedTotals.totalKunjungan), color: "#ed7d31" },
      ];

  // --- Data Transformation untuk YTD Table ---
  const tableData: YTDTableData[] = ytdData
    .filter((row) => row.remarks !== "YTD Loaded Into Barge/Vessel")
    .map((row) => {
      if (row.remarks === "YTD Completed Into Barge/Vessel") {
        const planVal = ytdYearTotals.plan;
        const realVal = ytdYearTotals.real;
        const pct = planVal > 0 ? (realVal / planVal) * 100 : 0;
        return {
          remarks: row.remarks,
          plan2025: `${format3(planVal)} WMT`,
          realisasiProgress: `${format3(realVal)} WMT`,
          percentage: `${pct.toFixed(2)}%`,
        } as YTDTableData;
      }
      return {
    remarks: row.remarks,
        plan2025: `${format3(row.plan_value)} WMT`,
        realisasiProgress: `${format3(row.realisasi_progress)} WMT`,
    percentage: `${row.percentage.toFixed(2)}%`,
      } as YTDTableData;
    });

  // --- Data untuk Charts mengikuti filter ---
  const currentTotalKunjungan = selectedTotals.totalKunjungan;
  const currentTotalRealisasi = selectedTotals.totalRitasePerKapal;
  const currentTarget = selectedTotals.target;
  const currentStockAwal = selectedTotals.stockAwal;
  const currentProduksi = selectedTotals.produksi;
  const currentProduksiMining = selectedTotals.produksiMining;
  const currentProduksiQc = selectedTotals.produksiQc;
  const currentPenjualan = selectedTotals.penjualan;

  const realisasiTargetPercentage =
    currentTarget > 0
      ? ((currentTotalRealisasi / currentTarget) * 100).toFixed(2)
      : "0.00";
  const daysInScope = totalsMode === 'yearTotals' ? (new Date(filterYear, 1, 29).getDate() === 29 ? 366 : 365) : new Date(filterYear, filterMonth, 0).getDate();
  const totalKunjunganPercentage =
    currentTotalKunjungan > 0
      ? ((currentTotalKunjungan / daysInScope) * 100).toFixed(2)
      : "0.00";

  // Show loading screen while checking authentication or fetching data
  // if (isLoadingData) {
  //   return <LoadingScreen />;
  // }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // Tambahkan definisi monthNames di luar komponen agar bisa diakses oleh handleMonthClick
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

  // Build yearly curve (current year) for bottom chart (non-cumulative per month)
  // Target source: per-month target from daily-operations (single monthly value, not sum)
  // Realisasi source: sum of daily ritase per month (loading-ritase-rates)
  const buildYearlyCurve = async (year: number) => {
    const labels: string[] = monthNames.map((m) => m.slice(0, 3));
    const monthlyTotals: number[] = [];
    const monthlyTargets: number[] = [];

    for (let m = 1; m <= 12; m++) {
      try {
        const ym = `${year}-${String(m).padStart(2, "0")}`;
        const days = await fetchDailyMonth(ym);
        const sumR = await fetchMonthRitaseTotal(ym);
        let monthTarget = 0;
        for (const d of days) {
          if (typeof d.target === 'number' && monthTarget === 0) monthTarget = d.target;
        }
        monthlyTotals.push(sumR);
        monthlyTargets.push(monthTarget);
      } catch {
        monthlyTotals.push(0);
        monthlyTargets.push(0);
      }
    }
    // Non-cumulative series
    setCurveData({ labels, cumRealisasi: monthlyTotals, cumTarget: monthlyTargets });
  };

  // Build curve whenever curveYear changes (independent of other filters)
  useEffect(() => {
    (async () => {
      setCurveLoading(true);
      try {
        await buildYearlyCurve(curveYear);
      } finally {
        setCurveLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curveYear]);

  // Initialize bar totals on mount (independent of global filters)
  useEffect(() => {
    (async () => {
      setBarLoading(true);
      try {
        await buildBarYearTotals(barYear);
      } finally {
        setBarLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute YTD totals for table: plan = sum monthly targets, real = vessel-status-total for year
  useEffect(() => {
    (async () => {
      setYtdLoading(true);
      try {
        let plan = 0;
        let real = 0;
        
        // Get real from vessel-status-total API
        try {
          const res = await fetch(`/api/vessel-status-total?year=${filterYear}`, { headers: { Accept: "application/json" } });
          if (res.ok) {
            const result = await res.json();
            real = result.data?.total || 0;
          }
        } catch {
          real = 0;
        }
        
        // Get plan from monthly targets
        for (let m = 1; m <= 12; m++) {
          const ym = `${filterYear}-${String(m).padStart(2, "0")}`;
          try {
            const days = await fetchDailyMonth(ym);
            let monthTarget = 0;
            for (const d of days) {
              if (typeof d.target === 'number' && monthTarget === 0) monthTarget = d.target;
            }
            plan += monthTarget;
          } catch {
            // ignore
          }
        }
        setYtdYearTotals({ plan, real });
      } catch {
        setYtdYearTotals({ plan: 0, real: 0 });
      } finally {
        setYtdLoading(false);
      }
    })();
  }, [filterYear]);

  // --- Data Transformation untuk Monthly Table ---
  // Fungsi ini akan mengisi semua 12 bulan, dengan data dari API jika ada, atau "-" jika tidak
  const transformDataForMonthlyTable = (
    metrics: MonthlyRealisasiPengapalanMetric[]
  ): TableDisplayData[] => {
    const allMonths: TableDisplayData[] = [];

    // Buat map untuk memudahkan pencarian data yang sudah ada berdasarkan month_str
    const dataMap = new Map<string, MonthlyRealisasiPengapalanMetric>();
    metrics.forEach((m) => dataMap.set(m.month_str, m));

    // Iterasi dari bulan 1 (Januari) hingga 12 (Desember)
    for (let i = 0; i < 12; i++) {
      const monthNumStr = String(i + 1).padStart(2, "0"); // Contoh: "01", "02", dst.
      const monthData = dataMap.get(monthNumStr); // Dapatkan data untuk bulan ini

      allMonths.push({
        bulan: monthNames[i],
        // Format angka ke string dengan 3 desimal dan tambahkan " WMT"
        totalRealisasi: monthData
          ? `${monthData.total_realisasi_wmt.toFixed(3)} WMT`
          : "-",
        target: monthData ? `${monthData.target_wmt.toFixed(3)} WMT` : "-",
        stockAwal: monthData
          ? `${monthData.stock_awal_wmt.toFixed(3)} WMT`
          : "-",
        produksi: monthData ? `${monthData.produksi_wmt.toFixed(3)} WMT` : "-",
        penjualan: monthData
          ? `${monthData.penjualan_wmt.toFixed(3)} WMT`
          : "-",
        totalKunjungan: monthData
          ? String(monthData.total_kunjungan_count)
          : "-",
      });
    }
    return allMonths;
  };

  const realisasiPengapalanData: TableDisplayData[] =
    transformDataForMonthlyTable(monthlyData);

  // Main dashboard content for authenticated users
  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="min-h-screen bg-[#f1f2f7] flex">
          {/* Sidebar */}
          <Sidebar onTabChange={handleTabChange} />

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-[#0075cf] mb-2">
                  Update Realisasi Pengapalan
                </h1>
                <div className="flex items-center gap-2 text-[#898484]">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {monthNames[filterMonth - 1]}
                  </span>{" "}
                  {/* Tampilkan bulan saja */}
                  {userRole !== 'user' && userBureu ? (
                    <span>Bureu: {userBureu}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const d = new Date(filterYear, filterMonth - 1, 1);
                    d.setMonth(d.getMonth() - 1);
                    setFilterYear(d.getFullYear());
                    setFilterMonth(d.getMonth() + 1);
                  }}
                  disabled={totalsMode === 'yearTotals'}
                >
                  {"<"} Prev
                </Button>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={totalsMode === 'yearTotals' ? 'ALL' : String(filterMonth).padStart(2, '0')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'ALL') {
                      setTotalsMode('yearTotals');
                    } else {
                      setTotalsMode('month');
                      setFilterMonth(parseInt(val, 10));
                    }
                  }}
                >
                  <option value="ALL">Sepanjang Tahun</option>
                  {monthNames.map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                >
                  {Array.from({ length: 5 }, (_, k) => new Date().getFullYear() - 2 + k).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    const d = new Date(filterYear, filterMonth - 1, 1);
                    d.setMonth(d.getMonth() + 1);
                    setFilterYear(d.getFullYear());
                    setFilterMonth(d.getMonth() + 1);
                  }}
                  disabled={totalsMode === 'yearTotals'}
                >
                  Next {">"}
                </Button>
              {/* Detail button moved to Sidebar as Daily Operations */}
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-7 gap-4 mb-8">
              {totalsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm bg-gray-200 animate-pulse">
                    <CardContent className="p-4 h-16" />
                  </Card>
                ))
              ) : (
                metrics.map((metric, index) => (
                <Card
                  key={index}
                  className="border-0 shadow-sm"
                  style={{ backgroundColor: metric.color }}
                >
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-[#273240] mb-2">
                      {metric.title}
                    </h3>
                    <p className="text-sm font-semibold text-[#273240]">
                      {metric.value}
                    </p>
                  </CardContent>
                </Card>
                ))
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Left Chart - Total Kunjungan */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-[#273240]">
                  Total Completed Kapal
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {totalsLoading ? (
                    <div className="w-48 h-48 bg-gray-100 animate-pulse mb-4" />
                  ) : (
                  <div className="relative w-48 h-48 mb-4">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#dedede"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#0075cf"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={
                          251.2 -
                          (parseFloat(totalKunjunganPercentage) / 100) * 251.2
                          }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#0075cf]">
                        {currentTotalKunjungan}
                      </span>
                    </div>
                  </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0075cf] rounded-sm"></div>
                    <span className="text-sm text-[#273240]">
                      {totalsMode === 'yearTotals' ? String(filterYear) : `${monthNames[filterMonth - 1]?.toUpperCase()} ${String(filterYear)}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Right Charts */}
              <div className="space-y-4">
                {/* Bottom Right Chart - Stock Awal, Produksi, Penjualan (year filter) */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-4">
                    {barLoading && (
                      <div className="w-full h-48 bg-gray-100 animate-pulse mb-3" />
                    )}
                    <div className="flex items-center justify-between">
                    <CardTitle className="text-[#273240] text-lg mb-4">
                      Stock Awal, Produksi, Penjualan
                    </CardTitle>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={barYear}
                        onChange={async (e) => {
                          const y = parseInt(e.target.value, 10);
                          setBarYear(y);
                          setBarLoading(true);
                          try {
                            await buildBarYearTotals(y);
                          } finally {
                            setBarLoading(false);
                          }
                        }}
                      >
                        {Array.from({ length: 7 }, (_, k) => new Date().getFullYear() - 3 + k).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    {!barLoading && (
                    <div className="flex justify-between items-end h-48 mb-4">
                      {/* Stock Awal Bar */}
                      <div
                        className="w-1/4 bg-[#273240] rounded"
                        style={{
                          height: `${
                            (barTotals.stockAwal /
                              Math.max(
                                barTotals.stockAwal,
                                barTotals.produksiMining + barTotals.produksiQc,
                                barTotals.penjualan,
                                1
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                      {/* Produksi Mining Bar */}
                      <div
                        className="w-1/4 bg-[#70ad47] rounded"
                        style={{
                          height: `${
                            (barTotals.produksiMining /
                              Math.max(
                                barTotals.stockAwal,
                                barTotals.produksiMining + barTotals.produksiQc,
                                barTotals.penjualan,
                                1
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                      {/* Produksi QC Bar */}
                      <div
                        className="w-1/4 bg-[#9bc2e6] rounded"
                        style={{
                          height: `${
                            (barTotals.produksiQc /
                              Math.max(
                                barTotals.stockAwal,
                                barTotals.produksiMining + barTotals.produksiQc,
                                barTotals.penjualan,
                                1
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                      {/* Penjualan Bar */}
                      <div
                        className="w-1/4 bg-[#ffd966] rounded"
                        style={{
                          height: `${
                            (barTotals.penjualan /
                              Math.max(
                                barTotals.stockAwal,
                                barTotals.produksiMining + barTotals.produksiQc,
                                barTotals.penjualan,
                                1
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#273240] rounded-full"></div>
                        <span className="text-[#273240]">
                          Stok awal ({format3(barTotals.stockAwal)} WMT)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#70ad47] rounded-full"></div>
                        <span className="text-[#273240]">
                          Produksi Mining ({format3(barTotals.produksiMining)} WMT)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#9bc2e6] rounded-full"></div>
                        <span className="text-[#273240]">
                          Produksi QC ({format3(barTotals.produksiQc)} WMT)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#ffd966] rounded-full"></div>
                        <span className="text-[#273240]">
                          Penjualan ({format3(barTotals.penjualan)} WMT)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Data Table */}
            <Card className="border-0 shadow-sm bg-white mb-8">
              <div className="bg-[#92d050] p-4 rounded-t-lg">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-[#273240]">
                  <div>Remarks</div>
                  <div>Plan 2025</div>
                  <div>Realisasi Progress</div>
                  <div>%</div>
                </div>
              </div>
              <CardContent className="p-0">
                {tableData.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-4 p-4 border-b border-[#dedede] last:border-b-0"
                  >
                    <div className="text-sm text-[#273240]">{row.remarks}</div>
                    <div className="text-sm text-[#273240]">{row.plan2025}</div>
                    <div className="text-sm text-[#273240]">
                      {row.realisasiProgress}
                    </div>
                    <div className="text-sm text-[#273240]">
                      {row.percentage}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bottom Full-Width Chart: Kurva Realisasi vs Target (yearly, selectable year) */}
            <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                  Kurva Realisasi vs Target
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={curveYear}
                    onChange={(e) => setCurveYear(parseInt(e.target.value, 10))}
                  >
                    {Array.from({ length: 7 }, (_, k) => new Date().getFullYear() - 3 + k).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-hidden">
                  {curveLoading ? (
                    <div className="w-full h-72 bg-gray-100 animate-pulse mb-2" />
                  ) : (
                  <>
                  <svg viewBox="0 0 900 320" className="w-full h-72">
                    <line x1="50" y1="20" x2="50" y2="280" stroke="#ddd" strokeWidth="1" />
                    <line x1="50" y1="280" x2="880" y2="280" stroke="#ddd" strokeWidth="1" />
                    {(() => {
                      const maxY = Math.max(...curveData.cumRealisasi, ...curveData.cumTarget, 1);
                      const toX = (idx: number) => {
                        const n = Math.max(curveData.labels.length - 1, 1);
                        return 50 + (idx * (830 / n));
                      };
                      const toY = (val: number) => 280 - (val / maxY) * 240;
                      const linePath = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
                      const realPath = linePath(curveData.cumRealisasi);
                      const targetPath = linePath(curveData.cumTarget);
                      return (
                        <g>
                          {/* Y-axis ticks and labels */}
                          {(() => {
                            const tickCount = 5;
                            const step = maxY / tickCount;
                            const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);
                            return ticks.map((tv, i) => (
                              <g key={`y-${i}`}>
                                <line x1={50} y1={toY(tv)} x2={880} y2={toY(tv)} stroke="#eee" strokeWidth="1" />
                                <text x={46} y={toY(tv) + 4} fontSize="10" textAnchor="end" fill="#666">{format3(tv)}</text>
                              </g>
                            ));
                          })()}
                          <path d={targetPath} fill="none" stroke="#ffd966" strokeWidth="3" />
                          <path d={realPath} fill="none" stroke="#273240" strokeWidth="3" />
                          {curveData.cumTarget.map((v, i) => (
                            <g key={`btp-${i}`}>
                              <circle cx={toX(i)} cy={toY(v)} r={3} fill="#ffd966" />
                              <title>{`${curveData.labels[i]}: Target ${format3(v)} WMT`}</title>
                            </g>
                          ))}
                          {curveData.cumRealisasi.map((v, i) => (
                            <g key={`brp-${i}`}>
                              <circle cx={toX(i)} cy={toY(v)} r={3} fill="#273240" />
                              <title>{`${curveData.labels[i]}: Realisasi ${format3(v)} WMT`}</title>
                            </g>
                          ))}
                          {curveData.labels.map((lb, i) => (
                            (i % Math.ceil(curveData.labels.length / 12) === 0) ? (
                              <text key={i} x={toX(i)} y={298} fontSize="11" textAnchor="middle" fill="#666">{lb}</text>
                            ) : null
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-[#273240]"></span> Realisasi</div>
                    <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-[#ffd966]"></span> Target</div>
                  </div>
                  </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
