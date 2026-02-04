"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
//import Sidebar from "../../components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Edit, ArrowLeft } from "lucide-react";
import { format, getDaysInMonth, parseISO, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/app/providers/auth_provider";
import { useCache } from "@/app/providers/cache_provider";

interface DailyRealisasiPengapalanMetric {
  id: number;
  record_date: string; // YYYY-MM-DD
  total_realisasi: number;
  target: number;
  stock_awal: number;
  produksi: number;
  produksi_mining?: number;
  produksi_qc?: number;
  penjualan: number;
  vessel_complete: number;
  created_at: string;
}

interface DailyTableDisplayData {
  tanggal: string; // "1 Mei 2025"
  realisasi: string;
  produksiMining: string;
  produksiQc: string;
  penjualan: string;
  kunjungan: string;
  target: string;
  stockAwal: string;
}

type UnknownRecord = Record<string, unknown>;

const format3 = (n: number | null | undefined): string =>
  n == null
    ? "-"
    : n.toLocaleString("en-US", {
        useGrouping: true,
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });

const formatInt = (n: number | null | undefined): string =>
  n == null
    ? "-"
    : n.toLocaleString("en-US", {
        useGrouping: true,
        maximumFractionDigits: 0,
      });

// Ambil bureu dari user tanpa any
function extractBureu(user: unknown): string | null {
  if (user && typeof user === "object") {
    const root = user as UnknownRecord;

    const appMeta = root["app_metadata"];
    if (appMeta && typeof appMeta === "object") {
      const obj = appMeta as UnknownRecord;
      const bureu = obj["bureu"];
      if (typeof bureu === "string") return bureu;
    }

    const userMeta = root["user_metadata"];
    if (userMeta && typeof userMeta === "object") {
      const obj = userMeta as UnknownRecord;
      const bureu = obj["bureu"];
      if (typeof bureu === "string") return bureu;
    }
  }
  return null;
}

export default function RealisasiPengapalanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const monthParam = params.year_month as string; // "YYYY-MM"

  const [isShipping, setIsShipping] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [isQc, setIsQc] = useState(false);

  const [fetchedDailyData, setFetchedDailyData] = useState<
    DailyRealisasiPengapalanMetric[]
  >([]);
  const [monthlyRealisasi, setMonthlyRealisasi] = useState<{totalRealisasi: number, vesselCount: number}>({totalRealisasi: 0, vesselCount: 0});
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { getCache, setCacheData, hasValidCache } = useCache();

  // Function to fetch realisasi data from realisasi API
  const fetchRealisasiData = async (monthYear: string): Promise<{totalRealisasi: number, vesselCount: number}> => {
    try {
      const res = await fetch(`/api/realisasi?monthYear=${encodeURIComponent(monthYear)}`);
      if (!res.ok) return {totalRealisasi: 0, vesselCount: 0};
      const result = await res.json();
      return {
        totalRealisasi: result.data?.totalRitase || 0,
        vesselCount: result.data?.completedVesselsCount || 0
      };
    } catch {
      return {totalRealisasi: 0, vesselCount: 0};
    }
  };

  useEffect(() => {
    const fetchDailyRealisasi = async () => {
      setIsLoading(true);
      setError(null);
      if (!monthParam) {
        setError("Parameter bulan tidak ditemukan di URL.");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch realisasi data from realisasi API
        const realisasiData = await fetchRealisasiData(monthParam);
        setMonthlyRealisasi(realisasiData);

        const response = await fetch(
          `/api/daily-operations?month=${encodeURIComponent(monthParam)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { message?: string }).message ||
              `HTTP error! status: ${response.status}`
          );
        }

        const data: DailyRealisasiPengapalanMetric[] = await response.json();
        setFetchedDailyData(data);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal memuat data operasional harian (unknown error).";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyRealisasi();
  }, [monthParam]);

  // Page loading control
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setPageLoading(false), 200);
      return () => clearTimeout(timer);
    } else {
      setPageLoading(true);
    }
  }, [isLoading]);

  const { user } = useAuth();

  useEffect(() => {
    const bureu = extractBureu(user);
    setIsShipping(bureu === "shipping");
    setIsMining(bureu === "mining");
    setIsQc(bureu === "qc");
  }, [user]);

  const generateDailyTableData = (
    metrics: DailyRealisasiPengapalanMetric[],
    currentMonthParam: string,
    realisasiData: {totalRealisasi: number, vesselCount: number}
  ): DailyTableDisplayData[] => {
    const [year, monthIndex] = currentMonthParam.split("-").map(Number);
    const firstDayOfMonth = new Date(year, monthIndex - 1, 1);
    const numDaysInMonth = getDaysInMonth(firstDayOfMonth);

    const allDaysMap = new Map<string, DailyTableDisplayData>();

    for (let i = 1; i <= numDaysInMonth; i++) {
      const date = new Date(year, monthIndex - 1, i);
      const formattedDate = format(date, "d MMMM yyyy", { locale: idLocale });
      allDaysMap.set(format(date, "yyyy-MM-dd"), {
        tanggal: formattedDate,
        realisasi: "-",
        produksiMining: "-",
        produksiQc: "-",
        penjualan: "-",
        kunjungan: "-",
        target: "-",
        stockAwal: "-",
      });
    }

    metrics.forEach((metric) => {
      const date = parseISO(metric.record_date);
      const formattedDateDisplay = format(date, "d MMMM yyyy", {
        locale: idLocale,
      });

      allDaysMap.set(metric.record_date, {
        tanggal: formattedDateDisplay,
        realisasi: `${format3(realisasiData.totalRealisasi)} WMT`,
        produksiMining: `${format3(metric.produksi_mining ?? metric.produksi ?? 0)} WMT`,
        produksiQc: `${format3(metric.produksi_qc ?? 0)} WMT`,
        penjualan: `${format3(realisasiData.totalRealisasi)} WMT`,
        kunjungan: formatInt(realisasiData.vesselCount),
        target: `${format3(metric.target)} WMT`,
        stockAwal: `${format3(metric.stock_awal)} WMT`,
      });
    });

    const sortedKeys = Array.from(allDaysMap.keys()).sort(); // YYYY-MM-DD sorts lexicographically by date
    return sortedKeys.map((k) => allDaysMap.get(k)!).filter(Boolean);
  };

  const allDailyData = generateDailyTableData(fetchedDailyData, monthParam, monthlyRealisasi);

  const handleBack = () => {
    router.back();
  };

  // Hanya shipping yang boleh edit Operasional Harian (penjualan/kunjungan)
  const handleEditDaily = (tanggalToEdit: string) => {
    if (!isShipping) {
      alert("Akses dibatasi: hanya bureu shipping yang dapat mengedit.");
      return;
    }
    const parsedDate = parse(tanggalToEdit, "d MMMM yyyy", new Date(), {
      locale: idLocale,
    });
    const originalDate = format(parsedDate, "yyyy-MM-dd");

    const base = `/realisasi_pengapalan/${monthParam}/edit-daily-operations`;
    // Sertakan month agar halaman edit tidak error
    const url = `${base}?date=${encodeURIComponent(
      originalDate
    )}&scope=shipping&allowed=completed,penjualan&month=${encodeURIComponent(
      monthParam
    )}`;

    router.push(url);
  };

  // Mining: edit Produksi Mining
  const handleEditMiningProduksi = (tanggalToEdit: string) => {
    if (!isMining) {
      alert("Akses dibatasi: hanya bureu Mining yang dapat mengedit produksi Mining.");
      return;
    }
    const parsedDate = parse(tanggalToEdit, "d MMMM yyyy", new Date(), {
      locale: idLocale,
    });
    const originalDate = format(parsedDate, "yyyy-MM-dd");
    const base = `/realisasi_pengapalan/${monthParam}/edit-daily-operations`;
    const url = `${base}?date=${encodeURIComponent(originalDate)}&scope=mining&allowed=produksiMining&month=${encodeURIComponent(monthParam)}`;
    router.push(url);
  };

  // QC: edit Produksi QC
  const handleEditQcProduksi = (tanggalToEdit: string) => {
    if (!isQc) {
      alert("Akses dibatasi: hanya bureu QC yang dapat mengedit produksi QC.");
      return;
    }
    const parsedDate = parse(tanggalToEdit, "d MMMM yyyy", new Date(), {
      locale: idLocale,
    });
    const originalDate = format(parsedDate, "yyyy-MM-dd");
    const base = `/realisasi_pengapalan/${monthParam}/edit-daily-operations`;
    const url = `${base}?date=${encodeURIComponent(originalDate)}&scope=qc&allowed=produksiQc&month=${encodeURIComponent(monthParam)}`;
    router.push(url);
  };

  const handleEditStockAwal = (tanggalToEdit: string) => {
    if (!isQc) {
      alert("Akses dibatasi: hanya bureu QC yang dapat mengedit stock awal.");
      return;
    }
    const parsedDate = parse(tanggalToEdit, "d MMMM yyyy", new Date(), {
      locale: idLocale,
    });
    const originalDate = format(parsedDate, "yyyy-MM-dd");
    const base = `/realisasi_pengapalan/${monthParam}/edit-daily-operations`;
    const url = `${base}?date=${encodeURIComponent(originalDate)}&scope=qc&allowed=stockAwal&month=${encodeURIComponent(monthParam)}`;
    router.push(url);
  };

  // Target/Stock: tidak diizinkan untuk semua user

  const displayMonthYear = format(parseISO(`${monthParam}-01`), "MMMM yyyy", {
    locale: idLocale,
  });

  if (pageLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
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
          <Button onClick={() => window.location.reload()} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        {/* <Sidebar onTabChange={() => {}} /> */}
        <div className="flex-1 p-8">
          {/* Data Operasional Harian */}
          <Card className="bg-white border-none mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-[#0075cf] hover:text-blue-800 flex items-center gap-x-1 px-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </Button>
                <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                  Data Operasional Harian ({displayMonthYear})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Tanggal
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


                      {(isMining || isQc) && (
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-white"
                          style={{ backgroundColor: "#0075cf" }}
                        >
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allDailyData.map((row) => (
                      <tr key={row.tanggal} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.tanggal}
                        </td>

                        
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.produksiMining}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.produksiQc}
                        </td>


                        {(isMining || isQc) && (
                          <td className="px-4 py-3 text-sm">
                            {isMining ? (
                              <Button
                                size="sm"
                                onClick={() => handleEditMiningProduksi(row.tanggal)}
                                style={{ backgroundColor: "#0075cf" }}
                                className="hover:bg-blue-700 text-white"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleEditQcProduksi(row.tanggal)}
                                style={{ backgroundColor: "#0075cf" }}
                                className="hover:bg-blue-700 text-white"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Stock Awal (QC only edit) */}
          <Card className="bg-white border-none">
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: "#273240" }}>
                Data Stock Awal ({displayMonthYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Tanggal
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#114771" }}
                      >
                        Stock Awal
                      </th>
                      {isQc && (
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-white"
                          style={{ backgroundColor: "#0075cf" }}
                        >
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allDailyData.map((row) => (
                      <tr key={row.tanggal} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.tanggal}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.stockAwal}
                        </td>
                        {isQc && (
                          <td className="px-4 py-3 text-sm">
                            <Button
                              size="sm"
                              onClick={() => handleEditStockAwal(row.tanggal)}
                              style={{ backgroundColor: "#0075cf" }}
                              className="hover:bg-blue-700 text-white"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
