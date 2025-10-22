"use client";
import { useState, useEffect } from "react";
import type React from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";

// Define the interface for SignificantIssue based on your Supabase table
interface SignificantIssue {
  id: number; // Changed from 'no' to 'id'
  tanggal: string;
  keterangan: string;
  created_at: string; // Add created_at if you want to use it
}

export default function EditSignificantIssuePage() {
  const router = useRouter();
  const params = useParams();
  const issueId = Number(params.issueNo); // Get the issue ID from the URL

  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [issueFound, setIssueFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssue = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/significant-issues/${issueId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setIssueFound(false);
            setError("Masalah signifikan tidak ditemukan.");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: SignificantIssue = await response.json();
        setTanggal(data.tanggal);
        setKeterangan(data.keterangan);
        setIssueFound(true);
      } catch (err: unknown) {
        console.error("Failed to fetch significant issue:", err);
        if (!error) setError("Gagal memuat data masalah signifikan.");
        setIssueFound(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isNaN(issueId)) {
      fetchIssue();
    } else {
      setIssueFound(false);
      setError("Nomor isu tidak valid.");
      setIsLoading(false);
    }
  }, [issueId, error]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/significant-issues/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tanggal, keterangan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      console.log("Significant issue updated successfully!");
      router.replace("/issues"); // Go back to the list page after saving
      router.refresh(); // Revalidate data on the list page
    } catch (err: unknown) {
      console.error("Failed to update significant issue:", err);
      setError("Gagal memperbarui masalah signifikan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data masalah signifikan...</p>
        </div>
      </div>
    );
  }

  if (!issueFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p>
            {error ||
              "Masalah signifikan tidak ditemukan atau terjadi kesalahan."}
          </p>
          <Button
            onClick={handleBack}
            style={{ backgroundColor: "#0075cf" }}
            className="mt-4"
          >
            Kembali
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
          <CardHeader className="pb-1"></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="tanggal"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Tanggal<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggal"
                  name="tanggal"
                  type="text"
                  placeholder="Hari/Bulan/Tahun"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="keterangan"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Keterangan
                </Label>
                <Textarea
                  id="keterangan"
                  name="keterangan"
                  placeholder="Significant Issue"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                className="w-full text-white"
                disabled={isLoading}
                style={{ backgroundColor: "#0075cf" }}
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
