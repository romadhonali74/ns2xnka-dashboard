"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"; // Sesuaikan path
import { Label } from "../../../components/ui/label"; // Sesuaikan path
import { Input } from "../../../components/ui/input"; // Sesuaikan path
import { Button } from "../../../components/ui/button"; // Sesuaikan path
import { ArrowLeft } from "lucide-react"; // Untuk ikon kembali
import { format, parse } from "date-fns"; // Import parse
import { id as idLocale } from "date-fns/locale"; // Untuk nama bulan dalam Bahasa Indonesia

// Interface untuk data yang diambil
interface DailyMetric {
  id: number;
  record_date: string; // YYYY-MM-DD
  loading_rate: number;
  ritase_rate: number;
  created_at: string;
  user_id?: string;
}

export default function EditDailyLrRrPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const monthParam = params.year_month as string; // Contoh: "2025-05" (dari URL)
  const dateParam = searchParams.get("date") as string; // Contoh: "2025-05-01" (dari query string)

  const [loadingRate, setLoadingRate] = useState<string>("");
  const [ritaseRate, setRitaseRate] = useState<string>("");
  const [isLoadingFetch, setIsLoadingFetch] = useState(true); // Untuk status fetch data awal
  const [isLoadingSave, setIsLoadingSave] = useState(false); // Untuk status saving data
  const [error, setError] = useState<string | null>(null);

  // Format tanggal untuk tampilan di UI
  const displayDate = dateParam
    ? format(parse(dateParam, "yyyy-MM-dd", new Date()), "d MMMM yyyy", {
        locale: idLocale,
      })
    : "Memuat Tanggal...";

  useEffect(() => {
    const fetchDailyMetric = async () => {
      setIsLoadingFetch(true);
      setError(null);
      if (!dateParam) {
        setError("Tanggal tidak ditemukan di URL.");
        setIsLoadingFetch(false);
        return;
      }

      try {
        // Panggil API untuk mendapatkan data metrik harian berdasarkan tanggal
        const response = await fetch(
          `/api/daily-rates?date=${encodeURIComponent(dateParam)}`
        );

        if (!response.ok) {
          // Jika data tidak ditemukan (misal, 404), inisialisasi dengan nilai kosong/nol
          if (response.status === 404) {
            console.warn(
              `No data found for date ${dateParam}. Initializing with empty values.`
            );
            setLoadingRate("0.000");
            setRitaseRate("0.000");
            return; // Keluar dari try block, tidak melempar error
          }
          // Untuk error selain 404, lempar error
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data: DailyMetric = await response.json();
        setLoadingRate(data.loading_rate.toFixed(3)); // Pre-fill dengan 3 desimal
        setRitaseRate(data.ritase_rate.toFixed(3)); // Pre-fill dengan 3 desimal
      } catch (err: unknown) {
        console.error("Failed to fetch daily metric for edit:", err);
        if (err instanceof Error) {
          setError(err.message || "Gagal memuat data untuk diedit.");
        } else {
          setError("Gagal memuat data untuk diedit (unknown error).");
        }
      } finally {
        setIsLoadingFetch(false);
      }
    };

    fetchDailyMetric();
  }, [dateParam]); // Re-fetch jika dateParam berubah

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSave(true);
    setError(null);

    if (!dateParam) {
      setError("Tanggal tidak valid untuk disimpan.");
      setIsLoadingSave(false);
      return;
    }

    const parsedLoadingRate = parseFloat(loadingRate);
    const parsedRitaseRate = parseFloat(ritaseRate);

    if (isNaN(parsedLoadingRate) || isNaN(parsedRitaseRate)) {
      setError("Loading Rate dan Ritase Rate harus berupa angka.");
      setIsLoadingSave(false);
      return;
    }

    try {
      const response = await fetch("/api/daily-rates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateParam,
          loadingRate: parsedLoadingRate,
          ritaseRate: parsedRitaseRate,
        }),
      });

      if (!response.ok) {
        // Jika PUT gagal, periksa apakah karena data tidak ada (404)
        if (response.status === 404) {
          console.log("Data tidak ditemukan, mencoba membuat data baru...");
          // Coba untuk membuat data baru dengan metode POST
          const insertResponse = await fetch("/api/daily-rates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              date: dateParam,
              loadingRate: parsedLoadingRate,
              ritaseRate: parsedRitaseRate,
            }),
          });

          if (!insertResponse.ok) {
            const insertErrorData = await insertResponse.json();
            throw new Error(
              insertErrorData.message ||
                `HTTP error! status: ${insertResponse.status}`
            );
          }
          console.log("Data harian baru berhasil dibuat!");
        } else {
          // Tangani error lain dari respons PUT
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }
      } else {
        // Jika PUT berhasil
        console.log("Data harian berhasil diperbarui!");
      }

      // Redirect dan refresh di luar blok if/else untuk kedua skenario berhasil
      router.push(`/loading_ritase_rate/${monthParam}`);
      router.refresh();
    } catch (err: unknown) {
      console.error("Gagal menyimpan data harian:", err);
      if (err instanceof Error) {
        setError(err.message || "Gagal menyimpan data harian.");
      } else {
        setError("Gagal menyimpan data harian (unknown error).");
      }
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleBack = () => {
    router.back(); // Kembali ke halaman sebelumnya
  };

  if (isLoadingFetch) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f1f2f7" }}
    >
      <div className="w-full max-w-md">
        <Card className="shadow-lg bg-white border-none">
          <CardHeader className="pb-1">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-[#0075cf] hover:text-blue-800 flex items-center gap-x-1 px-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </Button>
              <CardTitle
                className="text-xl font-bold ml-auto"
                style={{ color: "#0075cf" }}
              >
                Edit Data Harian ({displayDate})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="loadingRate"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Loading Rate
                </Label>
                <Input
                  id="loadingRate"
                  name="loadingRate"
                  type="number" // Ubah ke type="number"
                  step="0.001" // Izinkan desimal
                  placeholder="0.000"
                  value={loadingRate}
                  onChange={(e) => setLoadingRate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ritaseRate"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Ritase Rate
                </Label>
                <Input
                  id="ritaseRate"
                  name="ritaseRate"
                  type="number" // Ubah ke type="number"
                  step="0.001" // Izinkan desimal
                  placeholder="0.000"
                  value={ritaseRate}
                  onChange={(e) => setRitaseRate(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full text-white"
                disabled={isLoadingSave}
                style={{ backgroundColor: "#0075cf" }}
              >
                {isLoadingSave ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
