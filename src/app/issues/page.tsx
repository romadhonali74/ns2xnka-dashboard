"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../providers/auth_provider";

// Define the interface for SignificantIssue based on your Supabase table
interface SignificantIssue {
  id: number; // Changed from 'no' to 'id'
  tanggal: string;
  keterangan: string;
  created_at: string; // Add created_at if you want to use it
  bureu?: string | null;
}

export default function SignificantIssuesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userBureu, setUserBureu] = useState<string | null>(null);
  const [significantIssuesData, setSignificantIssuesData] = useState<
    SignificantIssue[]
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Filters (like loading_ritase_rate)
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
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0")); // '01'..'12'
  const [filterBureu, setFilterBureu] = useState<string>('');
  const [filtersReady, setFiltersReady] = useState<boolean>(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user && !filtersReady) {
      const metadata = user.user_metadata;
      setUserRole(metadata.role ?? null);
      const bureuMeta = (user as any)?.app_metadata?.bureu || (user as any)?.user_metadata?.bureu || (user as any)?.raw_app_meta_data?.bureu || (user as any)?.raw_user_meta_data?.bureu;
      const b = typeof bureuMeta === 'string' ? bureuMeta.toLowerCase() : null;
      setUserBureu(b);
      const valid = ['shipping','mining','qc'];
      const initial = (b && valid.includes(b)) ? b : 'shipping';
      setFilterBureu(initial);
      setFiltersReady(true);
    }
  }, [user, filtersReady]);

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const base = `/api/significant-issues?year=${encodeURIComponent(String(filterYear))}&month=${encodeURIComponent(filterMonth)}`;
        const valid = ['shipping','mining','qc'];
        const f = (filterBureu || '').toLowerCase().trim();
        const url = (f && valid.includes(f))
          ? `${base}&bureu=${encodeURIComponent(f)}`
          : base;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: SignificantIssue[] = await response.json();
        setSignificantIssuesData(data);
      } catch (err) {
        console.error("Failed to fetch significant issues:", err);
        setError("Gagal memuat data masalah signifikan.");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (filtersReady) fetchIssues();
  }, [filterYear, filterMonth, filterBureu, filtersReady]);

  const handleTabChange = (tab: string) => {
    console.log("Tab changed to:", tab);
  };

  const handleAddIssue = () => {
    router.push("/issues/add");
  };

  const handleEditIssue = (issueId: number) => {
    // Changed parameter to issueId
    router.push(`/issues/edit/${issueId}`);
  };

  if (isLoadingData) {
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

  const canEdit = (row: SignificantIssue) => {
    if (!userBureu) return false;
    return (row.bureu ?? '').toLowerCase() === userBureu.toLowerCase();
  };
  const normalizedFilter = (filterBureu || '').toLowerCase().trim();
  const filteredRows = (['shipping','mining','qc'].includes(normalizedFilter)
    ? significantIssuesData.filter((row) => ((row.bureu ?? '').toLowerCase().trim()) === normalizedFilter)
    : significantIssuesData);
  const anyEditable = filteredRows.some((row) => canEdit(row));

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
      <Sidebar onTabChange={handleTabChange} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#0075cf" }}>
                  Significant Issue
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const d = new Date(filterYear, parseInt(filterMonth, 10) - 1, 1);
                    d.setMonth(d.getMonth() - 1);
                    setFilterYear(d.getFullYear());
                    setFilterMonth(String(d.getMonth() + 1).padStart(2, "0"));
                  }}
                >
                  {"<"} Prev
                </Button>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  {monthNames.map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, "0")}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={filterBureu}
                  onChange={(e) => setFilterBureu(e.target.value)}
                >
                  <option value="shipping">Shipping</option>
                  <option value="mining">Mining</option>
                  <option value="qc">QC</option>
                </select>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                >
                  {Array.from({ length: 7 }, (_, k) => new Date().getFullYear() - 3 + k).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    const d = new Date(filterYear, parseInt(filterMonth, 10) - 1, 1);
                    d.setMonth(d.getMonth() + 1);
                    setFilterYear(d.getFullYear());
                    setFilterMonth(String(d.getMonth() + 1).padStart(2, "0"));
                  }}
                >
                  Next {">"}
                </Button>
                {(userRole === "admin" || (userBureu && ["shipping", "mining", "qc"].includes(userBureu))) && (
                  <Button
                    onClick={handleAddIssue}
                    style={{ backgroundColor: "#0075cf" }}
                    className="text-white"
                  >
                    <Plus className="w-4 h-4 mr-2 text-white" />
                    Tambah
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <Card className="bg-white border-none mb-6">
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: "#0075cf" }}>
                Daftar Masalah Signifikan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white rounded-tl-lg"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Tanggal
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Keterangan
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-medium text-white"
                        style={{ backgroundColor: "#92d050" }}
                      >
                        Bureu
                      </th>
                      {anyEditable ? (
                        <th
                          className="px-4 py-3 text-left text-sm font-medium text-white rounded-tr-lg"
                          style={{ backgroundColor: "#0075cf" }}
                        >
                          Action
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.tanggal}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {row.keterangan}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {(() => {
                            const b = (row.bureu ?? '').toLowerCase().trim();
                            if (b === 'shipping') return 'Shipping';
                            if (b === 'mining') return 'Mining';
                            if (b === 'qc') return 'QC';
                            return '-';
                          })()}
                        </td>
                        {anyEditable ? (
                          <td className="px-4 py-3 text-sm">
                            {canEdit(row) ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditIssue(row.id)}
                                  style={{ backgroundColor: "#0075cf" }}
                                  className="hover:bg-blue-700 text-white mr-1"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={async () => {
                                    if (!confirm("Hapus issue ini?")) return;
                                    try {
                                      const res = await fetch(`/api/significant-issues/${row.id}`, { method: "DELETE" });
                                      const ct = res.headers.get("content-type") || "";
                                      const body = ct.includes("application/json") ? await res.json() : {};
                                      if (!res.ok) throw new Error((body as any)?.message || `HTTP ${res.status}`);
                                      const url = `/api/significant-issues?year=${encodeURIComponent(String(filterYear))}&month=${encodeURIComponent(filterMonth)}`;
                                      const response = await fetch(url, { headers: { Accept: "application/json" } });
                                      const data: SignificantIssue[] = await response.json();
                                      setSignificantIssuesData(data);
                                    } catch (e) {
                                      alert(e instanceof Error ? e.message : "Gagal menghapus issue");
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Hapus
                                </Button>
                              </div>
                            ) : null}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
