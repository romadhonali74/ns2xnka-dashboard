"use client";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
//import Sidebar from "../../components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button"; // Sesuaikan path jika berbeda
import { Edit } from "lucide-react";
import { format, getDaysInMonth, parseISO, parse } from "date-fns"; // Import 'parse'
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/app/providers/auth_provider";

// Define interface for the data fetched from Supabase
interface DailyMetric {
  id: number;
  record_date: string; // Akan datang sebagai string dari DB (YYYY-MM-DD)
  loading_rate: number; // Akan datang sebagai number
  ritase_rate: number; // Akan datang sebagai number
  created_at: string;
  user_id?: string; // Opsional jika ada
}

// Interface for table display
interface DailyTableDisplayData {
  tanggal: string; // Format: "1 Mei 2025"
  loadingRate: string; // String dengan format desimal atau "-"
  rifaseRate: string; // String dengan format desimal atau "-"
}

// Interface for chart data
interface DailyChartData {
  date: string; // Format: "1-Mei-25"
  value: number;
}

export default function LoadingRateRifaseRateDetailPage() {
  const router = useRouter();
  const params = useParams();
  // Mengambil parameter sebagai 'year_month' (misalnya "2025-05")
  // Pastikan nama folder dynamic route Anda adalah [year_month]
  const monthParam = params.year_month as string;
  const [userRole, setUserRole] = useState<string | null>(null);

  const [fetchedMetrics, setFetchedMetrics] = useState<DailyMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      setUserRole(metadata.role ?? null);
    }
  }, [user]);

  useEffect(() => {
    const fetchDailyMetrics = async () => {
      setIsLoading(true);
      setError(null);

      // Validasi monthParam di awal untuk mencegah Invalid time value
      if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
        console.error(
          "LoadingRateRifaseRateDetailPage: Invalid monthParam format received:",
          monthParam
        );
        setError("Format bulan di URL tidak valid. Contoh: YYYY-MM.");
        setIsLoading(false);
        setFetchedMetrics([]); // Pastikan data kosong agar tabel tidak error
        return;
      }

      const formattedMonthForApi = monthParam;

      try {
        // Panggil API route untuk data harian berdasarkan bulan
        const response = await fetch(
          `/api/daily-rates?month=${encodeURIComponent(formattedMonthForApi)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          // Jika API mengembalikan 404 (misal, tidak ada data untuk bulan itu), kita tidak ingin menampilkan error merah,
          // tapi tetap set data kosong.
          if (response.status === 404) {
            console.warn(
              `No data found for month: ${formattedMonthForApi}, displaying empty table.`
            );
            setFetchedMetrics([]); // Set data kosong
            return; // Keluar dari try block, tidak melempar error
          }
          throw new Error( // Untuk error selain 404
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data: DailyMetric[] = await response.json();
        setFetchedMetrics(data);
      } catch (err: unknown) {
        console.error("Failed to fetch daily metrics:", err);
        if (err instanceof Error) {
          setError(err.message || "Gagal memuat data metrik harian.");
        } else {
          setError("Gagal memuat data metrik harian (unknown error).");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyMetrics();
  }, [monthParam]); // Re-fetch jika monthParam berubah

  // --- Data Transformation untuk Tabel ---
  const generateDailyTableData = (
    metrics: DailyMetric[],
    currentMonthParam: string
  ): DailyTableDisplayData[] => {
    // Tambahkan pengecekan validitas currentMonthParam di sini juga untuk mencegah error parse
    if (!currentMonthParam || !/^\d{4}-\d{2}$/.test(currentMonthParam)) {
      console.error(
        "generateDailyTableData: Invalid currentMonthParam format:",
        currentMonthParam
      );
      return []; // Mengembalikan array kosong jika parameter tidak valid
    }

    const [year, monthIndex] = currentMonthParam.split("-").map(Number);
    const firstDayOfMonth = new Date(year, monthIndex - 1, 1);
    const numDaysInMonth = getDaysInMonth(firstDayOfMonth);

    const allDaysMap = new Map<string, DailyTableDisplayData>();

    for (let i = 1; i <= numDaysInMonth; i++) {
      const date = new Date(year, monthIndex - 1, i);
      const formattedDate = format(date, "d MMMM yyyy", { locale: idLocale });
      allDaysMap.set(format(date, "yyyy-MM-dd"), {
        tanggal: formattedDate,
        loadingRate: "-",
        rifaseRate: "-",
      });
    }

    metrics.forEach((metric) => {
      const date = parseISO(metric.record_date);
      const formattedDateDisplay = format(date, "d MMMM yyyy", {
        locale: idLocale,
      });

      allDaysMap.set(metric.record_date, {
        tanggal: formattedDateDisplay,
        loadingRate: metric.loading_rate.toFixed(3), // Format ke string dengan 3 desimal
        rifaseRate: metric.ritase_rate.toFixed(3), // Format ke string dengan 3 desimal
      });
    });

    return Array.from(allDaysMap.values()).sort((a, b) => {
      // Parsing tanggal untuk sorting, asumsikan format "d MMMM yyyy"
      const dateA = parse(a.tanggal, "d MMMM yyyy", new Date(), {
        locale: idLocale,
      });
      const dateB = parse(b.tanggal, "d MMMM yyyy", new Date(), {
        locale: idLocale,
      });
      return dateA.getTime() - dateB.getTime();
    });
  };

  const allDailyTableData = generateDailyTableData(fetchedMetrics, monthParam);

  // --- Data Transformation untuk Charts ---
  const transformToChartData = (
    metrics: DailyMetric[],
    valueKey: keyof DailyMetric
  ): DailyChartData[] => {
    // Urutkan data berdasarkan tanggal untuk grafik yang benar
    const sortedMetrics = [...metrics].sort((a, b) => {
      const dateA = parseISO(a.record_date);
      const dateB = parseISO(b.record_date);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedMetrics.map((metric) => ({
      date: format(parseISO(metric.record_date), "d-MMM-yy", {
        locale: idLocale,
      }), // e.g., "1-Mei-25"
      value: metric[valueKey] as number, // Pastikan nilai adalah number
    }));
  };

  const dailyRitasiRateData = transformToChartData(
    fetchedMetrics,
    "ritase_rate"
  );
  const dailyLoadingRateData = transformToChartData(
    fetchedMetrics,
    "loading_rate"
  );

  const handleEditDailyLrRr = (tanggalToEdit: string) => {
    // Konversi tanggal tampilan ("d MMMM yyyy") kembali ke "YYYY-MM-DD"
    const parsedDate = parse(tanggalToEdit, "d MMMM yyyy", new Date(), {
      locale: idLocale,
    });
    const originalDate = format(parsedDate, "yyyy-MM-dd");

    const url = `/loading_ritase_rate/${monthParam}/edit-daily-lr-rr?date=${encodeURIComponent(
      originalDate
    )}`;
    console.log("Navigating to Daily LR/RR Edit URL:", url);
    router.push(url);
  };

  // const handleTabChange = (tab: string) => {
  //   console.log("Tab changed to:", tab);
  // };

  // --- Kondisi Loading dan Error ---
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data metrik harian...</p>
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

  // Mendapatkan nama bulan dan tahun untuk judul
  let displayMonthYear = "Memuat..."; // Default value
  try {
    // Tambahkan logging untuk melihat nilai monthParam
    console.log(
      "LoadingRateRifaseRateDetailPage: monthParam for displayMonthYear:",
      monthParam
    );
    // Coba parse tanggal. Jika monthParam tidak valid, ini akan melempar error
    const parsedMonthDate = parseISO(`${monthParam}-01`);
    if (isNaN(parsedMonthDate.getTime())) {
      // Cek jika hasil parse adalah Invalid Date
      throw new Error("Invalid monthParam format for date parsing.");
    }
    displayMonthYear = format(parsedMonthDate, "MMMM yyyy", {
      locale: idLocale,
    });
  } catch (e) {
    console.error(
      "LoadingRateRifaseRateDetailPage: Error parsing monthParam for displayMonthYear:",
      e
    );
    displayMonthYear = "Bulan Tidak Valid"; // Fallback jika parsing gagal
    // Tidak perlu setError di sini karena sudah ditangani di fetchDailyMetrics
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f2f7" }}>
      <div className="flex">
        {/* Sidebar Component */}
        {/* <Sidebar onTabChange={handleTabChange} /> */}

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Data Table */}
            <div className="lg:col-span-2">
              <Card className="bg-white rounded-lg shadow-sm overflow-hidden border-none">
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                    Total Loading Rate & Ritase Rate ({displayMonthYear})
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
                            style={{ backgroundColor: "#92d050" }}
                          >
                            Loading Rate
                          </th>
                          <th
                            className="px-4 py-3 text-left text-sm font-medium text-white"
                            style={{ backgroundColor: "#273240" }}
                          >
                            Ritase Rate
                          </th>
                          {userRole === "admin" && (
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
                        {allDailyTableData.map((row) => (
                          <tr key={row.tanggal} className="hover:bg-gray-50">
                            {" "}
                            {/* Gunakan tanggal sebagai key */}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.tanggal}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.loadingRate}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.rifaseRate}
                            </td>
                            {userRole === "admin" && (
                              <td className="px-4 py-3 text-sm">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleEditDailyLrRr(row.tanggal)
                                  }
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
            {/* Charts */}
            <div className="space-y-8">
              {/* Ritasi Rate Chart */}
              <Card className="bg-white rounded-lg shadow-sm p-6 border-none">
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                    Ritasi Rate (Daily)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyRitasiRateData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#666" }}
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#666" }}
                        domain={["auto", "auto"]} // Auto adjust domain based on data
                        tickMargin={10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0075cf"
                        strokeWidth={2}
                        dot={{ fill: "#0075cf", strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              {/* Loading Rate Chart */}
              <Card className="bg-white rounded-lg shadow-sm p-6 border-none">
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                    Loading Rate (Daily)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyLoadingRateData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#666" }}
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#666" }}
                        domain={["auto", "auto"]} // Auto adjust domain
                        tickMargin={10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#07e098"
                        strokeWidth={2}
                        dot={{ fill: "#07e098", strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
