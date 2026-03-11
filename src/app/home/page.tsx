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
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "../providers/auth_provider";
import AuthGuard from "../components/auth-guard";
import { useCache } from "../providers/cache_provider";

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
  truck_factor: number;
}

interface YTDRealisasiPengapalanMetric {
  remarks: string;
  plan_value: number;
  realisasi_progress: number;
  percentage: number;
}

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

interface TableDisplayData {
  bulan: string;
  totalRealisasi: string;
  target: string;
  stockAwal: string;
  produksi: string;
  penjualan: string;
  totalKunjungan: string;
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
  const [monthlyData, setMonthlyData] = useState<MonthlyRealisasiPengapalanMetric[]>([]);
  const [ytdData, setYtdData] = useState<YTDRealisasiPengapalanMetric[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userBureu, setUserBureu] = useState<string | null>(null);

  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedTotals, setSelectedTotals] = useState<SelectedTotals>({ 
    totalRealisasi: 0, target: 0, stockAwal: 0, produksi: 0, produksiMining: 0, 
    produksiQc: 0, penjualan: 0, totalKunjungan: 0, totalRitasePerKapal: 0 
  });
  const [curveData, setCurveData] = useState<CurveData>({ labels: [], cumRealisasi: [], cumTarget: [] });
  const [totalsMode, setTotalsMode] = useState<'month' | 'yearTotals'>('month');
  const [curveYear, setCurveYear] = useState<number>(new Date().getFullYear());
  const [barYear, setBarYear] = useState<number>(new Date().getFullYear());
  const [barTotals, setBarTotals] = useState<{ stockAwal: number; produksiMining: number; produksiQc: number; penjualan: number }>({ 
    stockAwal: 0, produksiMining: 0, produksiQc: 0, penjualan: 0 
  });
  const [ytdYearTotals, setYtdYearTotals] = useState<{ plan: number; real: number }>({ plan: 0, real: 0 });
  const [totalsLoading, setTotalsLoading] = useState<boolean>(false);
  const [realisasiLoading, setRealisasiLoading] = useState<boolean>(false);
  const [targetLoading, setTargetLoading] = useState<boolean>(false);
  const [produksiLoading, setProduksiLoading] = useState<boolean>(false);
  const [penjualanLoading, setPenjualanLoading] = useState<boolean>(false);
  const [kapalLoading, setKapalLoading] = useState<boolean>(false);
  const [curveLoading, setCurveLoading] = useState<boolean>(false);
  const [barLoading, setBarLoading] = useState<boolean>(false);
  const [ytdLoading, setYtdLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  const { user } = useAuth();
  const { getCache, setCacheData, hasValidCache } = useCache();

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      setUserRole(metadata.role ?? null);
      const bureuMeta = (user as any)?.app_metadata?.bureu || (user as any)?.user_metadata?.bureu || (user as any)?.raw_app_meta_data?.bureu || (user as any)?.raw_user_meta_data?.bureu;
      setUserBureu(typeof bureuMeta === 'string' ? bureuMeta : null);
    }
  }, [user]);

  useEffect(() => {
    const allLoadingComplete = !isLoadingData && !realisasiLoading && !targetLoading && !produksiLoading && !penjualanLoading && !kapalLoading && !curveLoading && !barLoading && !ytdLoading;
    if (allLoadingComplete) {
      const timer = setTimeout(() => setPageLoading(false), 200);
      return () => clearTimeout(timer);
    } else {
      setPageLoading(true);
    }
  }, [isLoadingData, realisasiLoading, targetLoading, produksiLoading, penjualanLoading, kapalLoading, curveLoading, barLoading, ytdLoading]);

  useEffect(() => {
    const fetchAllData = async () => {
      setError(null);
      try {
        const monthlyResponse = await fetch("/api/realisasi-pengapalan");
        if (!monthlyResponse.ok) {
          const errData = await monthlyResponse.json();
          throw new Error(errData.message || `HTTP error! status: ${monthlyResponse.status}`);
        }
        const monthlyMetrics: MonthlyRealisasiPengapalanMetric[] = await monthlyResponse.json();
        setMonthlyData(monthlyMetrics);

        const ytdResponse = await fetch("/api/realisasi-pengapalan/ytd-realisasi-pengapalan");
        if (!ytdResponse.ok) {
          const errData = await ytdResponse.json();
          throw new Error(errData.message || `HTTP error! status: ${ytdResponse.status}`);
        }
        const ytdMetrics: YTDRealisasiPengapalanMetric[] = await ytdResponse.json();
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

  const fetchDailyMonth = async (ym: string) => {
    const res = await fetch(`/api/daily-operations?month=${encodeURIComponent(ym)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as any).message || `HTTP ${res.status}`);
    }
    return (await res.json()) as Array<{ 
      record_date: string; total_realisasi: number; target: number; stock_awal: number; 
      produksi_mining?: number; produksi_qc?: number; penjualan: number; vessel_complete?: number; created_at?: string; 
    }>;
  };

  const fetchMonthRitaseTotal = async (ym: string): Promise<number> => {
    try {
      const res = await fetch(`/api/realisasi?monthYear=${encodeURIComponent(ym)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) return 0;
      const result = await res.json();
      return result.data?.totalRitase || 0;
    } catch (error) {
      return 0;
    }
  };

  const fetchCompletedVesselsCount = async (ym: string): Promise<number> => {
    try {
      const res = await fetch(`/api/vessel-status?monthYear=${encodeURIComponent(ym)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) return 0;
      const result = await res.json();
      const completedVessels = result.data?.filter((v: any) => v.status === 'completed') || [];
      return completedVessels.length;
    } catch {
      return 0;
    }
  };

  const fetchCompletedVesselsCountForYear = async (year: number): Promise<number> => {
    let totalCompleted = 0;
    for (let m = 1; m <= 12; m++) {
      const ym = `${year}-${String(m).padStart(2, "0")}`;
      const monthCount = await fetchCompletedVesselsCount(ym);
      totalCompleted += monthCount;
    }
    return totalCompleted;
  };

  const computeTotalsMonth = async (year: number, month: number) => {
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    
    // Fetch Realisasi
    setRealisasiLoading(true);
    const totalRitasePerKapal = await fetchMonthRitaseTotal(ym);
    setRealisasiLoading(false);
    
    // Fetch Target
    setTargetLoading(true);
    const days = await fetchDailyMonth(ym);
    const monthTarget = days.find((d) => typeof d.target === "number")?.target ?? 0;
    setTargetLoading(false);
    
    let stockAwal = 0;
    const prev = new Date(year, month - 1, 1);
    prev.setMonth(prev.getMonth() - 1);
    const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    
    try {
      const prevDays = await fetchDailyMonth(prevYm);
      const prevLastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
      
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
    
    // Fetch Produksi
    setProduksiLoading(true);
    let produksiMining = 0;
    try {
      const summaryResponse = await fetch(`/api/mining_summary?year=${year}&month=${month}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        const moronopoData = summaryData.find((item: any) => item.company_id === 3);
        produksiMining = moronopoData?.total_actual || 0;
      }
    } catch {
      produksiMining = 0;
    }
    const produksiQc = days.reduce((s, r) => s + (r.produksi_qc ?? 0), 0);
    const produksi = produksiMining + produksiQc;
    setProduksiLoading(false);
    
    // Fetch Penjualan
    setPenjualanLoading(true);
    const penjualan = totalRitasePerKapal;
    setPenjualanLoading(false);
    
    // Fetch Kapal
    setKapalLoading(true);
    const completedVesselsCount = await fetchCompletedVesselsCount(ym);
    setKapalLoading(false);
    const newTotals = { 
      totalRealisasi: totalRitasePerKapal, target: monthTarget, stockAwal, produksi, 
      produksiMining, produksiQc, penjualan, totalKunjungan: completedVesselsCount, totalRitasePerKapal 
    };
    setSelectedTotals(newTotals);
  };

  const computeTotalsYear = async (year: number) => {
    let sumR = 0, sumT = 0, sumS = 0, sumPM = 0, sumPQ = 0, sumJ = 0, sumV = 0;
    
    // Fetch Realisasi & Penjualan
    setRealisasiLoading(true);
    setPenjualanLoading(true);
    try {
      const res = await fetch(`/api/vessel-status-total?year=${year}`, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const result = await res.json();
        sumR = result.data?.total || 0;
        sumJ = result.data?.total || 0;
      }
    } catch {
      sumR = 0;
      sumJ = 0;
    }
    setRealisasiLoading(false);
    setPenjualanLoading(false);
    
    // Fetch Target
    setTargetLoading(true);
    for (let m = 1; m <= 12; m++) {
      try {
        const ym = `${year}-${String(m).padStart(2, "0")}`;
        const days = await fetchDailyMonth(ym);
        let tgt = 0;
        for (const d of days) {
          tgt = d.target ?? tgt;
          sumPQ += (d.produksi_qc ?? 0);
        }
        sumT += tgt;
      } catch {
        // ignore per-bulan
      }
    }
    setTargetLoading(false);
    
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
    
    // Fetch Produksi
    setProduksiLoading(true);
    try {
      const summaryResponse = await fetch(`/api/mining_summary?year=${year}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        const moronopoData = summaryData.filter((item: any) => item.company_id === 3);
        sumPM = moronopoData.reduce((sum: number, item: any) => sum + (item.total_actual || 0), 0);
      }
    } catch {
      sumPM = 0;
    }
    const sumP = sumPM + sumPQ;
    setProduksiLoading(false);
    
    // Fetch Kapal
    setKapalLoading(true);
    const yearCompletedCount = await fetchCompletedVesselsCountForYear(year);
    setKapalLoading(false);
    setSelectedTotals({ 
      totalRealisasi: sumR, target: sumT, stockAwal: sumS, produksi: sumP, 
      produksiMining: sumPM, produksiQc: sumPQ, penjualan: sumJ, 
      totalKunjungan: yearCompletedCount, totalRitasePerKapal: sumR 
    });
  };

  const buildBarYearTotals = async (year: number) => {
    let sumS = 0, sumPM = 0, sumPQ = 0;
    
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
    
    try {
      const summaryResponse = await fetch(`/api/mining_summary?year=${year}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        const moronopoData = summaryData.filter((item: any) => item.company_id === 3);
        sumPM = moronopoData.reduce((sum: number, item: any) => sum + (item.total_actual || 0), 0);
      }
    } catch {
      sumPM = 0;
    }
    
    // COMMENTED: Produksi QC calculation (not used in bar chart, uncomment if needed)
    // for (let m = 1; m <= 12; m++) {
    //   try {
    //     const ym = `${year}-${String(m).padStart(2, '0')}`;
    //     const days = await fetchDailyMonth(ym);
    //     for (const d of days) {
    //       sumPQ += (d.produksi_qc ?? 0);
    //     }
    //   } catch {
    //     // ignore
    //   }
    // }
    
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
        const cacheKey = `dashboard-${filterYear}-${filterMonth}-${totalsMode}`;
        
        if (hasValidCache(cacheKey)) {
          const cachedData = getCache(cacheKey);
          setSelectedTotals(cachedData.selectedTotals);
          setCurveData(cachedData.curveData);
          setBarTotals(cachedData.barTotals);
          setYtdYearTotals(cachedData.ytdYearTotals);
          return;
        }
        
        setTotalsLoading(true);
        setRealisasiLoading(true);
        setTargetLoading(true);
        setProduksiLoading(true);
        setPenjualanLoading(true);
        setKapalLoading(true);
        setCurveLoading(true);
        setBarLoading(true);
        setYtdLoading(true);
        
        const promises = [];
        
        if (totalsMode === 'yearTotals') {
          promises.push(computeTotalsYear(filterYear));
        } else {
          promises.push(computeTotalsMonth(filterYear, filterMonth));
        }
        
        promises.push((async () => {
          const labels: string[] = monthNames.map((m) => m.slice(0, 3));
          const monthlyTotals: number[] = [];
          const monthlyTargets: number[] = [];
          for (let m = 1; m <= 12; m++) {
            try {
              const ym = `${filterYear}-${String(m).padStart(2, "0")}`;
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
          setCurveData({ labels, cumRealisasi: monthlyTotals, cumTarget: monthlyTargets });
          setCurveLoading(false);
        })());
        promises.push((async () => {
          let sumS = 0, sumPM = 0, sumPQ = 0, sumJ = 0;
          try {
            const res = await fetch(`/api/vessel-status-total?year=${filterYear}`, { headers: { Accept: "application/json" } });
            if (res.ok) {
              const result = await res.json();
              sumJ = result.data?.total || 0;
            }
          } catch { sumJ = 0; }
          
          try {
            const summaryResponse = await fetch(`/api/mining_summary?year=${filterYear}`);
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              const moronopoData = summaryData.filter((item: any) => item.company_id === 3);
              sumPM = moronopoData.reduce((sum: number, item: any) => sum + (item.total_actual || 0), 0);
            }
          } catch { sumPM = 0; }
          
          setBarTotals({ stockAwal: sumS, produksiMining: sumPM, produksiQc: sumPQ, penjualan: sumJ });
          setBarLoading(false);
        })());
        promises.push((async () => {
          let plan = 0, real = 0;
          try {
            const res = await fetch(`/api/vessel-status-total?year=${filterYear}`, { headers: { Accept: "application/json" } });
            if (res.ok) {
              const result = await res.json();
              real = result.data?.total || 0;
            }
          } catch { real = 0; }
          
          for (let m = 1; m <= 12; m++) {
            const ym = `${filterYear}-${String(m).padStart(2, "0")}`;
            try {
              const days = await fetchDailyMonth(ym);
              let monthTarget = 0;
              for (const d of days) {
                if (typeof d.target === 'number' && monthTarget === 0) monthTarget = d.target;
              }
              plan += monthTarget;
            } catch { }
          }
          setYtdYearTotals({ plan, real });
          setYtdLoading(false);
        })());
        
        await Promise.all(promises);
        
      } catch (e) {
      } finally {
        setTotalsLoading(false);
        // Individual loading states are now set in their respective promises
      }
    })();
  }, [filterYear, filterMonth, totalsMode]);

  // Cache data after state updates
  useEffect(() => {
    if (!totalsLoading && !realisasiLoading && !targetLoading && !produksiLoading && !penjualanLoading && !kapalLoading && !curveLoading && !barLoading && !ytdLoading) {
      const cacheKey = `dashboard-${filterYear}-${filterMonth}-${totalsMode}`;
      setCacheData(cacheKey, {
        selectedTotals,
        curveData,
        barTotals,
        ytdYearTotals
      }, 5);
    }
  }, [selectedTotals, curveData, barTotals, ytdYearTotals, totalsLoading, realisasiLoading, targetLoading, produksiLoading, penjualanLoading, kapalLoading, curveLoading, barLoading, ytdLoading, filterYear, filterMonth, totalsMode]);

  const handleTabChange = (tab: string) => {
    // Tab change handler
  };

  const format3 = (n: number) =>
    n.toLocaleString("en-US", {
      useGrouping: true,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  const formatInt = (n: number) =>
    n.toLocaleString("en-US", { useGrouping: true, maximumFractionDigits: 0 });

  const metrics: MetricCardData[] = [
    { title: "Total Realisasi", value: `${format3(selectedTotals.totalRitasePerKapal)} WMT`, color: "#92d050" },
    { title: "Target", value: `${format3(selectedTotals.target)} WMT`, color: "#ffd966" },
    { title: "Produksi", value: `${format3(selectedTotals.produksiMining)} WMT`, color: "#70ad47" },
    { title: "Penjualan", value: `${format3(selectedTotals.penjualan)} WMT`, color: "#ffd966" },
    { title: "Total Completed Kapal", value: formatInt(selectedTotals.totalKunjungan), color: "#ed7d31" },
  ];

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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const transformDataForMonthlyTable = (
    metrics: MonthlyRealisasiPengapalanMetric[]
  ): TableDisplayData[] => {
    const allMonths: TableDisplayData[] = [];
    const dataMap = new Map<string, MonthlyRealisasiPengapalanMetric>();
    metrics.forEach((m) => dataMap.set(m.month_str, m));

    for (let i = 0; i < 12; i++) {
      const monthNumStr = String(i + 1).padStart(2, "0");
      const monthData = dataMap.get(monthNumStr);

      allMonths.push({
        bulan: monthNames[i],
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

  const realisasiPengapalanData: TableDisplayData[] = transformDataForMonthlyTable(monthlyData);

  return (
    <AuthGuard>
      <style jsx>{`
        @keyframes growUp {
          from {
            height: 0;
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes drawCircle {
          from {
            stroke-dashoffset: 251.2;
          }
          to {
            stroke-dashoffset: var(--final-offset);
          }
        }
        @keyframes drawPath {
          from {
            stroke-dasharray: 0 1000;
          }
          to {
            stroke-dasharray: 1000 0;
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="flex h-screen overflow-hidden bg-[#f1f2f7]">
        <Sidebar onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-6 w-full">
          {/* {pageLoading && (
            <div className="absolute inset-0 flex items-start justify-center pt-16 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-300">
                <div className="text-center">
                  <div>                    
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-3"></div>
                    <br></br>
                    <p className="text-gray-700 font-medium">Memuat Data ...</p>                    
                  </div>                  
                </div>
              </div>
            </div>
          )} */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#0075cf] mb-2">
                Realisasi Pengapalan
              </h1>
              <div className="flex items-center gap-2 text-[#898484]">
                <Calendar className="w-4 h-4" />
                <span>{totalsMode === 'yearTotals' ? `${filterYear}` : `${monthNames[filterMonth - 1]} ${filterYear}`}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                onClick={() => {
                  const d = new Date(filterYear, filterMonth - 1, 1);
                  d.setMonth(d.getMonth() - 1);
                  setFilterYear(d.getFullYear());
                  setFilterMonth(d.getMonth() + 1);
                }}
                disabled={totalsMode === 'yearTotals'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                className="px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-700 font-medium shadow-md hover:shadow-lg hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ease-in-out cursor-pointer"
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
                className="px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-700 font-medium shadow-md hover:shadow-lg hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 ease-in-out cursor-pointer"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 11 }, (_, k) => new Date().getFullYear() - 5 + k).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                onClick={() => {
                  const d = new Date(filterYear, filterMonth - 1, 1);
                  d.setMonth(d.getMonth() + 1);
                  setFilterYear(d.getFullYear());
                  setFilterMonth(d.getMonth() + 1);
                }}
                disabled={totalsMode === 'yearTotals'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-8">
            {metrics.map((metric, index) => {
              const isLoading = 
                (metric.title === 'Total Realisasi' && realisasiLoading) ||
                (metric.title === 'Target' && targetLoading) ||
                (metric.title === 'Produksi' && produksiLoading) ||
                (metric.title === 'Penjualan' && penjualanLoading) ||
                (metric.title === 'Total Completed Kapal' && kapalLoading);
              
              return isLoading ? (
                <Card key={index} className="border-0 shadow-sm bg-gray-200 animate-pulse">
                  <CardContent className="p-4 h-16" />
                </Card>
              ) : (
                <Card
                  key={index}
                  className="border-0 shadow-sm"
                  style={{ 
                    backgroundColor: metric.color,
                    animation: 'slideInUp 0.5s ease-out both',
                    animationDelay: `${index * 0.1}s`
                  }}
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
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#273240]">
                    Total Kapal Selesai
                  </CardTitle>
                  <span className="text-xs text-gray-500 font-medium">
                    {totalsMode === 'yearTotals' ? `Data Tahunan ${filterYear}` : `${monthNames[filterMonth - 1]?.toUpperCase()} ${filterYear}`}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {kapalLoading ? (
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
                      style={{
                        animation: !kapalLoading ? 'drawCircle 1.5s ease-out 0.5s both' : 'none',
                        '--final-offset': `${251.2 - (parseFloat(totalKunjunganPercentage) / 100) * 251.2}`
                      } as any}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#0075cf]">
                      {currentTotalKunjungan}
                    </span>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#273240]">
                      Produksi dan Penjualan
                    </CardTitle>
                    <span className="text-xs text-gray-500 font-medium">
                      Data Tahun {filterYear}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {barLoading ? (
                    <div className="w-48 h-48 bg-gray-100 animate-pulse mb-4" />
                  ) : (
                  <div className="flex justify-center items-end h-48 mb-4 max-w-xs mx-auto">
                    <div
                      className="w-16 bg-[#70ad47] rounded mr-4 transition-all duration-1000 ease-out"
                      style={{
                        height: `${
                          (barTotals.produksiMining /
                            Math.max(
                              barTotals.produksiMining,
                              barTotals.penjualan,
                              1
                            )) *
                          100
                        }%`,
                        animation: !barLoading ? 'growUp 1s ease-out' : 'none'
                      }}
                    ></div>
                    <div
                      className="w-16 bg-[#ffd966] rounded transition-all duration-1000 ease-out"
                      style={{
                        height: `${
                          (barTotals.penjualan /
                            Math.max(
                              barTotals.produksiMining,
                              barTotals.penjualan,
                              1
                            )) *
                          100
                        }%`,
                        animation: !barLoading ? 'growUp 1s ease-out 0.2s both' : 'none'
                      }}
                    ></div>
                  </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#70ad47] rounded-full"></div>
                      <span className="text-[#273240]">
                        Produksi ({format3(barTotals.produksiMining)} WMT)
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

          <Card className="border-0 shadow-sm bg-white mb-8">
            <div className="bg-[#92d050] p-4 rounded-t-lg">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-[#273240]">
                <div>Remarks</div>
                <div>Plan {filterYear}</div>
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
                  <div className="text-sm text-[#273240]">{row.plan2025.replace('Plan 2025', `Plan ${filterYear}`)}</div>
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

          <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                Kurva Realisasi vs Target
              </CardTitle>
              <span className="text-xs text-gray-500 font-medium">
                Data Tahun {filterYear}
              </span>
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
                        <path d={targetPath} fill="none" stroke="#ffd966" strokeWidth="3" style={{
                          animation: !curveLoading ? 'drawPath 2s ease-out 0.3s both' : 'none'
                        }} />
                        <path d={realPath} fill="none" stroke="#273240" strokeWidth="3" style={{
                          animation: !curveLoading ? 'drawPath 2s ease-out 0.6s both' : 'none'
                        }} />
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