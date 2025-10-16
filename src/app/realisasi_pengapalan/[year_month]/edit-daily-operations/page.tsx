"use client";
import { useState, useEffect, useRef } from "react";
import type React from "react";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format, parse } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/app/providers/auth_provider";

interface DailyRealisasiPengapalanMetric {
  id: number;
  record_date: string; // YYYY-MM-DD
  total_realisasi: number;
  target: number;
  stock_awal: number;
  produksi_mining?: number;
  produksi_qc?: number;
  penjualan: number;
  vessel_complete: number;
  created_at: string;
}

type UnknownRecord = Record<string, unknown>;

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

// Helpers penjualan integer: format dengan koma, tanpa desimal
function formatGroupedInt(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toLocaleString("en-US", {
    useGrouping: true,
    maximumFractionDigits: 0,
  });
}
function parseGroupedInt(s: string): number | null {
  const cleaned = (s || "").replace(/[^\d\-]/g, "");
  if (!cleaned) return null;
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : null;
}

// Helpers untuk decimal 3 angka (en-US grouping, . decimal)
function formatGroupedDecimal3(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toLocaleString("en-US", {
    useGrouping: true,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}
function parseGroupedDecimal3(s: string): number | null {
  const cleaned = (s || "").replace(/[^\d.,\-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(/,/g, "");
  const num = parseFloat(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 1000) / 1000;
}

// Live formatting helpers with caret preservation for decimal with grouping
function formatIntGroup(intStr: string): string {
  if (!intStr) return "";
  // remove leading zeros but leave single zero
  const normalized = intStr.replace(/^0+(\d)/, "$1");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function normalizeDecimalInput(raw: string): { intPart: string; decPart: string; hasDot: boolean } {
  const cleaned = (raw || "").replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return { intPart: cleaned, decPart: "", hasDot: false };
  const intPart = cleaned.slice(0, firstDot).replace(/\./g, "");
  const decRaw = cleaned.slice(firstDot + 1).replace(/\./g, "");
  const decPart = decRaw.slice(0, 3); // limit 3 decimals
  return { intPart, decPart, hasDot: true };
}
function computeCaretForDecimal(formatted: string, targetIntDigits: number, isAfterDot: boolean, targetDecDigits: number): number {
  let intDigits = 0;
  let decDigits = 0;
  let seenDot = false;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    if (ch === ".") {
      if (!isAfterDot && intDigits === targetIntDigits) return i; // caret right before dot
      seenDot = true;
      continue;
    }
    if (/\d/.test(ch)) {
      if (!seenDot) {
        intDigits++;
        if (!isAfterDot && intDigits === targetIntDigits) return i + 1;
      } else {
        decDigits++;
        if (isAfterDot && decDigits === targetDecDigits) return i + 1;
      }
    }
  }
  return formatted.length;
}
// Hitung caret baru setelah formatting (berdasar jumlah digit di kiri caret)
function computeCaretFromDigitsLeft(
  formatted: string,
  digitsLeft: number
): number {
  let seenDigits = 0;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    if (/\d/.test(ch)) {
      seenDigits++;
      if (seenDigits === digitsLeft) return i + 1;
    }
  }
  return formatted.length;
}

// Helper aman baca response body agar tidak error JSON kosong
async function readBody(
  res: Response
): Promise<{ type: "json" | "text" | "empty"; value: unknown }> {
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const json = await res.json();
      return { type: "json", value: json };
    }
    const text = await res.text();
    if (text && text.trim().length > 0) return { type: "text", value: text };
    return { type: "empty", value: null };
  } catch {
    return { type: "empty", value: null };
  }
}

export default function EditDailyOperationsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const monthParam = params.year_month as string;
  const dateParam = searchParams.get("date") as string;
  const allowedParam = (searchParams.get("allowed") as string) || "";

  const [isShipping, setIsShipping] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [isQc, setIsQc] = useState(false);

  const [produksiMining, setProduksiMining] = useState<string>("");
  const [produksiQc, setProduksiQc] = useState<string>("");
  const [penjualan, setPenjualan] = useState<string>(""); // string ber-separator, tanpa desimal
  const [kunjungan, setKunjungan] = useState<string>("");
  const [stockAwal, setStockAwal] = useState<string>("");
  const [totalRealisasi, setTotalRealisasi] = useState<string>("0.000");

  const [isLoadingFetch, setIsLoadingFetch] = useState(true);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const bureu = extractBureu(user);
    setIsShipping(bureu === "shipping");
    setIsMining(bureu === "mining");
    setIsQc(bureu === "qc");
  }, [user]);

  // Function to get vessel completed count and total realisasi from realisasi API
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
    const fetchDailyData = async () => {
      setIsLoadingFetch(true);
      setError(null);
      if (!dateParam) {
        setError("Tanggal tidak ditemukan di URL.");
        setIsLoadingFetch(false);
        return;
      }

      try {
        // Get month from date for realisasi data
        const dateObj = new Date(dateParam);
        const monthYear = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        
        // Fetch realisasi data (total realisasi and vessel count)
        const realisasiData = await fetchRealisasiData(monthYear);
        setKunjungan(String(realisasiData.vesselCount));
        setTotalRealisasi(formatGroupedDecimal3(realisasiData.totalRealisasi));

        const response = await fetch(
          `/api/daily-operations?date=${encodeURIComponent(
            dateParam
          )}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setProduksiMining("0.000");
            setProduksiQc("0.000");
            setPenjualan(formatGroupedDecimal3(0));
            setStockAwal("0.000");
            return;
          }

          const body = await readBody(response);
          const msg =
            body.type === "json"
              ? (body.value as { message?: string }).message ||
                `HTTP ${response.status}`
              : body.type === "text"
              ? String(body.value)
              : `HTTP ${response.status}`;
          throw new Error(msg);
        }

        const data = (await response.json()) as DailyRealisasiPengapalanMetric;
        setProduksiMining(formatGroupedDecimal3((data.produksi_mining ?? 0)));
        setProduksiQc(formatGroupedDecimal3((data.produksi_qc ?? 0)));
        setPenjualan(formatGroupedDecimal3((data.penjualan ?? 0)));
        setStockAwal(formatGroupedDecimal3((data.stock_awal ?? 0)));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data operasional harian untuk diedit."
        );
      } finally {
        setIsLoadingFetch(false);
      }
    };

    fetchDailyData();
  }, [dateParam]);

  const penjualanRef = useRef<HTMLInputElement>(null);
  const prodMiningRef = useRef<HTMLInputElement>(null);
  const prodQcRef = useRef<HTMLInputElement>(null);
  const stockAwalRef = useRef<HTMLInputElement>(null);

  // Penjualan: izinkan desimal 3 angka (format seperti produksi), jaga caret
  const onChangePenjualan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isShipping) return;
    const input = e.target as HTMLInputElement;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const left = raw.slice(0, caret);
    const leftIntDigits = left.split(".")[0].replace(/\D/g, "").length;
    const isAfterDot = left.includes(".");
    const leftDecDigits = isAfterDot ? (left.split(".")[1] || "").replace(/\D/g, "").length : 0;
    const norm = normalizeDecimalInput(raw);
    const groupedInt = formatIntGroup(norm.intPart);
    const formatted = groupedInt + (norm.hasDot ? "." + norm.decPart : "");
    setPenjualan(formatted);
    requestAnimationFrame(() => {
      const el = penjualanRef.current;
      if (!el) return;
      const newCaret = computeCaretForDecimal(formatted, leftIntDigits, isAfterDot, leftDecDigits);
      el.setSelectionRange(newCaret, newCaret);
    });
  };
  const onBlurPenjualan = () => {
    if (!isShipping) return;
    const n = parseGroupedDecimal3(penjualan);
    setPenjualan(formatGroupedDecimal3(n));
  };

  // Produksi Mining/QC: izinkan ketik bebas (digit, koma, titik), format saat blur
  const onChangeProduksiMining = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMining) return;
    const input = e.target as HTMLInputElement;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const left = raw.slice(0, caret);
    const leftIntDigits = left.split(".")[0].replace(/\D/g, "").length;
    const isAfterDot = left.includes(".");
    const leftDecDigits = isAfterDot ? (left.split(".")[1] || "").replace(/\D/g, "").length : 0;
    const norm = normalizeDecimalInput(raw);
    const groupedInt = formatIntGroup(norm.intPart);
    const formatted = groupedInt + (norm.hasDot ? "." + norm.decPart : "");
    setProduksiMining(formatted);
    requestAnimationFrame(() => {
      const el = prodMiningRef.current;
      if (!el) return;
      const newCaret = computeCaretForDecimal(formatted, leftIntDigits, isAfterDot, leftDecDigits);
      el.setSelectionRange(newCaret, newCaret);
    });
  };
  const onBlurProduksiMining = () => {
    if (!isMining) return;
    const n = parseGroupedDecimal3(produksiMining);
    setProduksiMining(formatGroupedDecimal3(n));
  };
  const onChangeProduksiQc = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isQc) return;
    const input = e.target as HTMLInputElement;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const left = raw.slice(0, caret);
    const leftIntDigits = left.split(".")[0].replace(/\D/g, "").length;
    const isAfterDot = left.includes(".");
    const leftDecDigits = isAfterDot ? (left.split(".")[1] || "").replace(/\D/g, "").length : 0;
    const norm = normalizeDecimalInput(raw);
    const groupedInt = formatIntGroup(norm.intPart);
    const formatted = groupedInt + (norm.hasDot ? "." + norm.decPart : "");
    setProduksiQc(formatted);
    requestAnimationFrame(() => {
      const el = prodQcRef.current;
      if (!el) return;
      const newCaret = computeCaretForDecimal(formatted, leftIntDigits, isAfterDot, leftDecDigits);
      el.setSelectionRange(newCaret, newCaret);
    });
  };
  const onBlurProduksiQc = () => {
    if (!isQc) return;
    const n = parseGroupedDecimal3(produksiQc);
    setProduksiQc(formatGroupedDecimal3(n));
  };

  // Stock Awal (QC)
  const onChangeStockAwal = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isQc) return;
    const input = e.target as HTMLInputElement;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const left = raw.slice(0, caret);
    const leftIntDigits = left.split(".")[0].replace(/\D/g, "").length;
    const isAfterDot = left.includes(".");
    const leftDecDigits = isAfterDot ? (left.split(".")[1] || "").replace(/\D/g, "").length : 0;
    const norm = normalizeDecimalInput(raw);
    const groupedInt = formatIntGroup(norm.intPart);
    const formatted = groupedInt + (norm.hasDot ? "." + norm.decPart : "");
    setStockAwal(formatted);
    requestAnimationFrame(() => {
      const el = stockAwalRef.current;
      if (!el) return;
      const newCaret = computeCaretForDecimal(formatted, leftIntDigits, isAfterDot, leftDecDigits);
      el.setSelectionRange(newCaret, newCaret);
    });
  };
  const onBlurStockAwal = () => {
    if (!isQc) return;
    const n = parseGroupedDecimal3(stockAwal);
    setStockAwal(formatGroupedDecimal3(n));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSave(true);
    setError(null);

    const canEdit = isShipping || isMining || isQc;
    if (!canEdit) {
      setError("Akses dibatasi: hanya bureu shipping/mining/qc yang dapat mengedit.");
      setIsLoadingSave(false);
      return;
    }

    if (!dateParam) {
      setError("Tanggal tidak valid untuk disimpan.");
      setIsLoadingSave(false);
      return;
    }

    const parsedPenjualan = isShipping ? parseGroupedDecimal3(totalRealisasi) : null;
    const parsedProdMining = parseGroupedDecimal3(produksiMining) ?? 0;
    const parsedProdQc = parseGroupedDecimal3(produksiQc) ?? 0;
    const parsedStockAwal = parseGroupedDecimal3(stockAwal) ?? 0;

    if (isShipping && parsedPenjualan === null) {
      setError("Total Realisasi tidak valid untuk Penjualan.");
      setIsLoadingSave(false);
      return;
    }

    try {
             const response = await fetch("/api/daily-operations", {
         method: "PUT",
         headers: {
           "Content-Type": "application/json",
           Accept: "application/json",
           ...(extractBureu(user) ? { "x-bureu": String(extractBureu(user)).toLowerCase() } : {}),
         },
         body: JSON.stringify({
           date: dateParam,
           ...(isShipping && parsedPenjualan !== null ? { penjualan: parsedPenjualan } : {}),
           ...(isMining ? { produksi_mining: parsedProdMining } : {}),
           ...(isQc && allowedParam === "produksiQc" ? { produksi_qc: parsedProdQc } : {}),
           ...(isQc && allowedParam === "stockAwal" ? { stockAwal: parsedStockAwal } : {}),
         }),
       });

      if (!response.ok) {
        if (response.status === 404) {
          const insertResponse = await fetch(
            "/api/daily-operations",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(extractBureu(user) ? { "x-bureu": String(extractBureu(user)).toLowerCase() } : {}),
              },
              body: JSON.stringify({
                date: dateParam,
                ...(isShipping && parsedPenjualan !== null ? { penjualan: parsedPenjualan } : {}),
                ...(isMining ? { produksi_mining: parsedProdMining } : {}),
                ...(isQc && allowedParam === "produksiQc" ? { produksi_qc: parsedProdQc } : {}),
                ...(isQc && allowedParam === "stockAwal" ? { stockAwal: parsedStockAwal } : {}),
                }),
            }
          );

          if (!insertResponse.ok) {
            const ib = await readBody(insertResponse);
            const body = (ib.type === "json" ? ib.value : {}) as { message?: string; details?: string };
            const msg = body.message || "Gagal membuat data (POST).";
            const details = body.details ? `: ${body.details}` : "";
            throw new Error(msg + details);
          }
        } else {
          const b = await readBody(response);
          const body = (b.type === "json" ? b.value : {}) as { message?: string; details?: string };
          const msg = body.message || (b.type === "text" ? String(b.value) : "Gagal menyimpan (PUT).");
          const details = body.details ? `: ${body.details}` : "";
          throw new Error(msg + details);
        }
      }

      router.replace(`/realisasi_pengapalan/${monthParam}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data operasional harian."
      );
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleBack = () => {
    router.back();
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
                Edit Operasional Harian (
                {dateParam
                  ? format(
                      parse(dateParam, "yyyy-MM-dd", new Date()),
                      "d MMMM yyyy",
                      {
                        locale: idLocale,
                      }
                    )
                  : "Memuat Tanggal..."}
                )
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

              {/* Total Realisasi - auto calculated from realisasi API */}
              {allowedParam !== "stockAwal" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="total_realisasi"
                    className="text-sm font-medium"
                    style={{ color: "#273240" }}
                  >
                    Total Realisasi - Auto Calculated
                  </Label>
                  <Input
                    id="total_realisasi"
                    name="total_realisasi"
                    type="text"
                    placeholder="0.000"
                    value={totalRealisasi}
                    disabled={true}
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Nilai otomatis berdasarkan vessel status completed</p>
                </div>
              )}

              {/* Produksi (Mining) - hanya bureu mining */}
              {allowedParam !== "stockAwal" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="produksi_mining"
                    className="text-sm font-medium"
                    style={{ color: "#273240" }}
                  >
                    Produksi (Mining)
                  </Label>
                  <Input
                    ref={prodMiningRef}
                    id="produksi_mining"
                    name="produksi_mining"
                    type="text"
                    placeholder="0.000"
                    value={produksiMining}
                    onChange={onChangeProduksiMining}
                    onBlur={onBlurProduksiMining}
                    disabled={!isMining}
                  />
                </div>
              )}

              {/* QC: Tampilkan input sesuai allowedParam */}
              {allowedParam !== "stockAwal" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="produksi_qc"
                    className="text-sm font-medium"
                    style={{ color: "#273240" }}
                  >
                    Produksi (QC)
                  </Label>
                  <Input
                    ref={prodQcRef}
                    id="produksi_qc"
                    name="produksi_qc"
                    type="text"
                    placeholder="0.000"
                    value={produksiQc}
                    onChange={onChangeProduksiQc}
                    onBlur={onBlurProduksiQc}
                    disabled={!isQc}
                  />
                </div>
              )}
              {allowedParam === "stockAwal" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="stock_awal"
                    className="text-sm font-medium"
                    style={{ color: "#273240" }}
                  >
                    Stock Awal (QC)
                  </Label>
                  <Input
                    ref={stockAwalRef}
                    id="stock_awal"
                    name="stock_awal"
                    type="text"
                    placeholder="0.000"
                    value={stockAwal}
                    onChange={onChangeStockAwal}
                    onBlur={onBlurStockAwal}
                    disabled={!isQc}
                  />
                </div>
              )}

              {/* Penjualan - same as Total Realisasi (from vessel status) */}
              {allowedParam !== "stockAwal" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="penjualan"
                    className="text-sm font-medium"
                    style={{ color: "#273240" }}
                  >
                    Penjualan (Same as Total Realisasi)
                  </Label>
                  <Input
                    ref={penjualanRef}
                    id="penjualan"
                    name="penjualan"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.000"
                    value={totalRealisasi}
                    disabled={true}
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Nilai sama dengan Total Realisasi (otomatis)</p>
                </div>
              )}

              {/* Kunjungan (Vessel Completed) - auto calculated from vessel status */}
              {allowedParam !== "stockAwal" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="kunjungan"
                    className="text-sm font-medium"
                    style={{ color: "#273240" }}
                  >
                    Kunjungan (Vessel Completed) - Auto Calculated
                  </Label>
                  <Input
                    id="kunjungan"
                    name="kunjungan"
                    type="text"
                    placeholder="0"
                    value={kunjungan}
                    disabled={true}
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Nilai otomatis berdasarkan vessel status completed</p>
                </div>
              )}

                             <Button
                 type="submit"
                 className="w-full text-white"
                 disabled={isLoadingSave || !(isShipping || isMining || isQc)}
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
