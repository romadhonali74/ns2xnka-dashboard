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
import { useAuth } from "@/app/providers/auth_provider";

// Define interface for the data fetched from Supabase (daily)
interface DailyOpsMetric {
  id: number;
  record_date: string; // YYYY-MM-DD
  target: number;
}

export default function EditTargetStockPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const monthParam = params.year_month as string; // Contoh: "2025-05" (dari URL)
  const dateParam = searchParams.get("date") as string; // tidak dipakai untuk mode bulanan

  const { user } = useAuth();
  const [isShipping, setIsShipping] = useState(false);

  const [target, setTarget] = useState<string>("");
  const [isLoadingFetch, setIsLoadingFetch] = useState(true); // Untuk status fetch data awal
  const [isLoadingSave, setIsLoadingSave] = useState(false); // Untuk status saving data
  const [error, setError] = useState<string | null>(null);

  //Format tanggal untuk tampilan di UI.
  const displayMonth = monthParam
    ? format(parse(`${monthParam}-01`, "yyyy-MM-dd", new Date()), "MMMM yyyy", {
        locale: idLocale,
      })
    : "Memuat Bulan...";

  useEffect(() => {
    const bureu = ((): string | null => {
      if (user && typeof user === "object") {
        const root = (user as unknown) as Record<string, unknown>;
        const am = root["app_metadata"] as Record<string, unknown> | undefined;
        if (am && typeof am["bureu"] === "string") return am["bureu"] as string;
        const um = root["user_metadata"] as Record<string, unknown> | undefined;
        if (um && typeof um["bureu"] === "string") return um["bureu"] as string;
      }
      return null;
    })();
    setIsShipping(bureu === "shipping");
  }, [user]);

  useEffect(() => {
    const fetchDailyData = async () => {
      setIsLoadingFetch(true);
      setError(null);
      if (!monthParam) {
        setError("Bulan tidak ditemukan di URL.");
        setIsLoadingFetch(false);
        return;
      }

      try {
        // Ambil data satu bulan, pakai salah satu nilai target yang ada
        const response = await fetch(
          `/api/daily-operations?month=${encodeURIComponent(monthParam)}`
        );

        if (!response.ok) {
          // Jika data tidak ditemukan (misal, 404), inisialisasi dengan nilai kosong/nol
          if (response.status === 404) {
            setTarget("0.000");
            return;
          }
          // Untuk error selain 404, lempar error
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data: DailyOpsMetric[] = await response.json();
        const firstWithTarget = (data || []).find((d) => typeof d.target === "number");
        setTarget(((firstWithTarget?.target ?? 0)).toFixed(3));
      } catch (err: unknown) {
        console.error("Failed to fetch target/stock data for edit:", err);
        if (err instanceof Error) {
          setError(
            err.message || "Gagal memuat data target & stock awal untuk diedit."
          );
        } else {
          setError(
            "Gagal memuat data target & stock awal untuk diedit (unknown error)."
          );
        }
      } finally {
        setIsLoadingFetch(false);
      }
    };

    fetchDailyData();
  }, [monthParam]); // Re-fetch jika bulan berubah

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSave(true);
    setError(null);

    if (!isShipping) {
      setError("Akses dibatasi: hanya bureu shipping yang dapat mengedit target bulanan.");
      setIsLoadingSave(false);
      return;
    }

    // Validasi input numerik
    const parsedTarget = parseFloat(target);

    if (isNaN(parsedTarget)) {
      setError("Target harus berupa angka.");
      setIsLoadingSave(false);
      return;
    }

    try {
      const response = await fetch("/api/daily-operations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: monthParam,
          target: parsedTarget,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      router.replace(`/realisasi_pengapalan/${monthParam}`);
      router.refresh(); // Revalidate data di halaman sebelumnya
    } catch (err: unknown) {
      console.error("Failed to save target & stock awal data:", err);
      if (err instanceof Error) {
        setError(err.message || "Gagal menyimpan data target & stock awal.");
      } else {
        setError("Gagal menyimpan data target & stock awal (unknown error).");
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
                Edit Target Bulanan ({displayMonth})
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
                  htmlFor="target"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Target
                </Label>
                <Input
                  id="target"
                  name="target"
                  type="number" // Ubah ke type="number"
                  step="0.001" // Izinkan desimal
                  placeholder="0.000"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </div>

              {/* Hanya target bulanan yang bisa diedit oleh shipping */}
              {!isShipping && (
                <p className="text-xs text-gray-500">Hanya bureu shipping yang dapat mengubah target bulanan.</p>
              )}

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
