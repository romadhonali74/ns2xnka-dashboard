"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Undo2 } from "lucide-react";
import Sidebar from "../components/sidebar";
import { useUserRole } from "../hooks/useUserRole";
import { useVessels } from "../hooks/useVessels";
import { useMonthVessels } from "../hooks/useMonthVessels";
import { useLoadingData } from "../hooks/useLoadingRitaseData";
import { useMonthVesselExclusions } from "../hooks/useMonthVesselExclusions";

type ShiftCell = { loadingRate: number | null; ritaseRate: number | null };
type CellValue = { s1: ShiftCell; s2: ShiftCell };

const MONTHS_ID = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

function getCurrentMonthYear(): string {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(monthYear: string): string {
  const [y, m] = monthYear.split("-");
  const found = MONTHS_ID.find((x) => x.value === m);
  return `${found?.label ?? m} ${y}`;
}

function getDaysInMonth(monthYear: string): number {
  const [y, m] = monthYear.split("-").map((v) => parseInt(v, 10));
  return new Date(y, m, 0).getDate();
}

function generateDatesForMonth(monthYear: string): string[] {
  const total = getDaysInMonth(monthYear);
  const dates: string[] = [];
  for (let d = 1; d <= total; d++) {
    dates.push(`${monthYear}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

function getPrevMonthYear(monthYear: string): string {
  const [y, m] = monthYear.split("-").map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function getNextMonthYear(monthYear: string): string {
  const [y, m] = monthYear.split("-").map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() + 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function buildMonthYear(month: string, year: string): string {
  return `${year}-${month}`;
}

function generateYearOptions(start: number, end: number): string[] {
  const years: string[] = [];
  for (let y = start; y <= end; y++) years.push(String(y));
  return years;
}

const parseEnNumber = (input: string): number | null => {
  const raw = (input || "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.\-]/g, "");
  const withoutCommas = cleaned.replace(/,/g, "");
  const parts = withoutCommas.split(".");
  const norm =
    parts.length > 2
      ? `${parts.slice(0, -1).join("")}.${parts.at(-1)}`
      : withoutCommas;
  const num = parseFloat(norm);
  return Number.isFinite(num) ? num : null;
};

const formatRitase = (value: number | null | undefined): string => {
  if (value == null) return "";
  return value.toLocaleString("en-US", {
    useGrouping: true,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const formatLoading = (value: number | null | undefined): string => {
  if (value == null) return "";
  return value.toLocaleString("en-US", {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

function formatIntGroup(intStr: string): string {
  if (!intStr) return "";
  const normalized = intStr.replace(/^0+(\d)/, "$1");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function normalizeDecimalInput(raw: string): {
  intPart: string;
  decPart: string;
  hasDot: boolean;
} {
  const cleaned = (raw || "").replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return { intPart: cleaned, decPart: "", hasDot: false };
  const intPart = cleaned.slice(0, firstDot).replace(/\./g, "");
  const decRaw = cleaned.slice(firstDot + 1).replace(/\./g, "");
  const decPart = decRaw.slice(0, 3);
  return { intPart, decPart, hasDot: true };
}

function computeCaretForDecimal(
  formatted: string,
  targetIntDigits: number,
  isAfterDot: boolean,
  targetDecDigits: number
): number {
  let intDigits = 0;
  let decDigits = 0;
  let seenDot = false;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    if (ch === ".") {
      if (!isAfterDot && intDigits === targetIntDigits) return i;
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

export default function LoadingRateTable() {
  const { isSuperAdmin, crudPermissions, isLoading: roleLoading } = useUserRole();
  const crud = crudPermissions['loading-rate'] ?? { canCreate: false, canEdit: false, canDelete: false };
  const isShipping = isSuperAdmin || crud.canCreate || crud.canEdit;
  const {
    vessels,
    loading: vesselsLoading,
    error: vesselsError,
    addVessel,
  } = useVessels();

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    getCurrentMonthYear()
  );
  const [showOnlyWithData, setShowOnlyWithData] = useState<boolean>(false);

  const {
    data: loadingMonthlyData,
    loading: dataLoading,
    error: dataError,
    mutate,
  } = useLoadingData(selectedMonthYear);

  const { excluded } = useMonthVesselExclusions(selectedMonthYear);

  const dates = useMemo(
    () => generateDatesForMonth(selectedMonthYear),
    [selectedMonthYear]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    vessel: string;
    columnSeq?: number;
  } | null>(null);
  const [selectedRowDate, setSelectedRowDate] = useState<string | null>(null);

  const [loadingRateS1Display, setLoadingRateS1Display] = useState<string>("");
  const [loadingRateS2Display, setLoadingRateS2Display] = useState<string>("");
  const [ritaseRateDisplay, setRitaseRateDisplay] = useState<string>("");
  const s1Ref = useRef<HTMLInputElement>(null as unknown as HTMLInputElement);
  const s2Ref = useRef<HTMLInputElement>(null as unknown as HTMLInputElement);
  const ritRef = useRef<HTMLInputElement>(null as unknown as HTMLInputElement);

  const [newVesselName, setNewVesselName] = useState("");
  const [isAddMonthVesselOpen, setIsAddMonthVesselOpen] = useState(false);
  const [addMonthVesselQuery, setAddMonthVesselQuery] = useState<string>("");
  const [showVesselSuggestions, setShowVesselSuggestions] =
    useState<boolean>(false);
  const [pendingMonthVessels, setPendingMonthVessels] = useState<string[]>([]);
  const [addVesselForm, setAddVesselForm] = useState({
    name: "",
    buyer: "",
    rencanaMuat: "",
    commencedLoadingDate: "",
    commencedLoadingTime: ""
  });
  const [addVesselErrors, setAddVesselErrors] = useState<{ name?: string; buyer?: string }>({});
  const [isAddingVessel, setIsAddingVessel] = useState(false);
  const [displayIndexByDate, setDisplayIndexByDate] = useState<
    Record<string, Record<string, string>>
  >({});
  const [dragInfo, setDragInfo] = useState<{
    seq?: number;
    vIdx: number;
  } | null>(null);

  // State untuk modal detail kapal
  const [isVesselDetailOpen, setIsVesselDetailOpen] = useState(false);
  const [vesselDetailForm, setVesselDetailForm] = useState({
    name: "",
    buyer: "",
    rencanaMuat: "",
    commencedLoadingDate: "",
    commencedLoadingTime: ""
  });
  const [vesselStatuses, setVesselStatuses] = useState<Record<string, string>>({});

  const vesselsWithData: string[] = useMemo(() => {
    if (!loadingMonthlyData) return [];
    const names = new Set<string>();
    for (const byDay of Object.values(loadingMonthlyData as any)) {
      for (const [name, bySeqMap] of Object.entries(byDay as any)) {
        if (!bySeqMap || typeof bySeqMap !== "object") continue;
        let has = false;
        for (const seqObj of Object.values(bySeqMap as any)) {
          const s1 = (seqObj as any)?.s1;
          const s2 = (seqObj as any)?.s2;
          if (
            s1?.loadingRate != null ||
            s1?.ritaseRate != null ||
            s2?.loadingRate != null ||
            s2?.ritaseRate != null
          ) {
            has = true;
            break;
          }
        }
        if (has) names.add(name as string);
      }
    }
    return Array.from(names);
  }, [loadingMonthlyData]);

  const masterNames: string[] = useMemo(
    () => vessels.map((v) => v.vessel_name),
    [vessels]
  );
  const { entries: monthEntries, mutate: mutateMonth } =
    useMonthVessels(selectedMonthYear);
  type VesselEntry = { name: string; seq?: number; display_order?: number };
  const allVesselEntries: VesselEntry[] = useMemo(() => {
    const baseEntries: VesselEntry[] =
      monthEntries && monthEntries.length > 0
        ? monthEntries.map((e) => ({
            name: e.name,
            seq: e.seq,
            display_order: (e as any).display_order,
          }))
        : [];
    const ordered: VesselEntry[] = [...baseEntries];
    const hasName = (arr: VesselEntry[], n: string) =>
      arr.some((e) => e.name === n);
    for (const name of vesselsWithData) {
      if (!hasName(ordered, name)) ordered.push({ name });
    }
    for (const nm of pendingMonthVessels)
      if (!hasName(ordered, nm)) ordered.push({ name: nm });
    return ordered;
  }, [masterNames, vesselsWithData, monthEntries, pendingMonthVessels]);

  const baseVesselEntries = useMemo(() => {
    if (!showOnlyWithData) return allVesselEntries;
    const set = new Set<string>(vesselsWithData);
    const filtered: VesselEntry[] = allVesselEntries.filter((e) =>
      set.has(e.name)
    );
    return filtered;
  }, [showOnlyWithData, allVesselEntries, vesselsWithData]);
  
  const activeVesselEntries: VesselEntry[] = useMemo(() => {
    const arr = [...baseVesselEntries];
    arr.sort((a, b) => {
      const ao = (a as any)?.display_order ?? 1e9;
      const bo = (b as any)?.display_order ?? 1e9;
      if (ao !== bo) return ao - bo;
      const asq = (a as any)?.seq ?? 1e9;
      const bsq = (b as any)?.seq ?? 1e9;
      return asq - bsq;
    });
    return arr;
  }, [baseVesselEntries]);
  
  const activeVessels: string[] = useMemo(
    () => activeVesselEntries.map((e) => e.name),
    [activeVesselEntries]
  );

  const getCellValue = (
    date: string,
    vessel: string,
    seq?: number | null
  ): CellValue | null => {
    if (!loadingMonthlyData) return null;
    const rowAny = (loadingMonthlyData as any)[date];
    if (!rowAny) return null;
    if (seq == null) return null;
    const byName = (rowAny as any)[vessel];
    if (!byName || typeof byName !== "object") return null;
    const bySeq = (byName as any)[seq];
    if (!bySeq || typeof bySeq !== "object") return null;
    return { s1: bySeq.s1, s2: bySeq.s2 } as CellValue;
  };

  const buildDisplayKey = useCallback(
    (date: string, vessel: string, key?: string) => {
      const safeVessel = vessel.replace(/\s+/g, "_");
      return `lr_display_${selectedMonthYear}_${date}_${safeVessel}${
        key ? `_${key}` : ""
      }`;
    },
    [selectedMonthYear]
  );

  useEffect(() => {
    try {
      const map: Record<string, Record<string, string>> = {};
      for (const d of dates) {
        const inner: Record<string, string> = {};
        for (let i = 0; i < activeVesselEntries.length; i++) {
          const entry = activeVesselEntries[i];
          const vessel = entry.name;
          const stored = localStorage.getItem(buildDisplayKey(d, vessel));
          if (stored) inner[vessel] = stored;
        }
        if (Object.keys(inner).length > 0) map[d] = inner;
      }
      setDisplayIndexByDate(map);
    } catch {}
  }, [
    selectedMonthYear,
    dates.join(","),
    activeVesselEntries.map((e) => `${e.name}:${e.seq ?? "x"}`).join("|"),
  ]);

  const calculateTotalRitaseForDate = useCallback(
    (date: string, vesselNames: string[]): number => {
      if (!loadingMonthlyData) return 0;
      let total = 0;
      const unique = Array.from(new Set(vesselNames));
      for (const vesselName of unique) {
        const byName = (loadingMonthlyData as any)?.[date]?.[vesselName] as
          | Record<number, any>
          | undefined;
        if (!byName || typeof byName !== "object") continue;
        for (const v of Object.values(byName)) {
          const r = ((v as any)?.s1?.ritaseRate ??
            (v as any)?.s2?.ritaseRate ??
            0) as number;
          total += r;
        }
      }
      return total;
    },
    [loadingMonthlyData]
  );
  
  const calculateTotalLoadingForDate = useCallback(
    (date: string, vesselNames: string[]): number => {
      if (!loadingMonthlyData) return 0;
      let total = 0;
      const unique = Array.from(new Set(vesselNames));
      for (const vesselName of unique) {
        const byName = (loadingMonthlyData as any)?.[date]?.[vesselName] as
          | Record<number, any>
          | undefined;
        if (!byName || typeof byName !== "object") continue;
        for (const v of Object.values(byName)) {
          const s1 = (v as any)?.s1?.loadingRate ?? 0;
          const s2 = (v as any)?.s2?.loadingRate ?? 0;
          total += s1 + s2;
        }
      }
      return total;
    },
    [loadingMonthlyData]
  );

  const handleCellClick = (
    date: string,
    vessel: string,
    columnSeq?: number
  ) => {
    setSelectedCell({ date, vessel, columnSeq });
    const existing = getCellValue(date, vessel, columnSeq ?? null);
    setLoadingRateS1Display(
      existing?.s1?.loadingRate == null
        ? ""
        : formatLoading(existing.s1.loadingRate)
    );
    setLoadingRateS2Display(
      existing?.s2?.loadingRate == null
        ? ""
        : formatLoading(existing.s2.loadingRate)
    );
    const combinedR =
      existing?.s1?.ritaseRate ?? null ?? existing?.s2?.ritaseRate ?? null;
    setRitaseRateDisplay(combinedR == null ? "" : formatRitase(combinedR));
    setIsModalOpen(true);
  };

  const handleVesselNameClick = async (vesselName: string) => {
    
    try {
      const url = `/api/vessel-details?vesselName=${encodeURIComponent(vesselName)}&monthYear=${encodeURIComponent(selectedMonthYear)}`;
      
      const response = await fetch(url);
      
      const result = await response.json();
      
      if (result.data) {
        setVesselDetailForm({
          name: vesselName,
          buyer: result.data.buyer || "",
          rencanaMuat: result.data.rencana_muat || "",
          commencedLoadingDate: result.data.commenced_loading_date || "",
          commencedLoadingTime: result.data.commenced_loading_time || ""
        });
      } else {
        setVesselDetailForm({
          name: vesselName,
          buyer: "",
          rencanaMuat: "",
          commencedLoadingDate: "",
          commencedLoadingTime: ""
        });
      }
    } catch (error) {
      console.error('Error in handleVesselNameClick:', error);
      setVesselDetailForm({
        name: vesselName,
        buyer: "",
        rencanaMuat: "",
        commencedLoadingDate: "",
        commencedLoadingTime: ""
      });
    }
    setIsVesselDetailOpen(true);
  };

  const handleSaveVesselDetail = async () => {
    
    try {
      const payload = {
        vesselName: vesselDetailForm.name,
        buyer: vesselDetailForm.buyer,
        rencanaMuat: vesselDetailForm.rencanaMuat,
        commencedLoadingDate: vesselDetailForm.commencedLoadingDate,
        commencedLoadingTime: vesselDetailForm.commencedLoadingTime,
        monthYear: selectedMonthYear
      };
      
      const response = await fetch("/api/vessel-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('Error response:', errorBody);
        throw new Error(errorBody.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      setIsVesselDetailOpen(false);
    } catch (error) {
      console.error('Save vessel detail error:', error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan detail kapal");
    }
  };

  const onChangeDecimalLive = (
    e: React.ChangeEvent<HTMLInputElement>,
    set: (v: string) => void,
    ref: React.RefObject<HTMLInputElement>
  ) => {
    const input = e.target;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const left = raw.slice(0, caret);
    const leftIntDigits = left.split(".")[0].replace(/\D/g, "").length;
    const isAfterDot = left.includes(".");
    const leftDecDigits = isAfterDot
      ? (left.split(".")[1] || "").replace(/\D/g, "").length
      : 0;
    const norm = normalizeDecimalInput(raw);
    const groupedInt = formatIntGroup(norm.intPart);
    const formatted = groupedInt + (norm.hasDot ? "." + norm.decPart : "");
    set(formatted);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const newCaret = computeCaretForDecimal(
        formatted,
        leftIntDigits,
        isAfterDot,
        leftDecDigits
      );
      el.setSelectionRange(newCaret, newCaret);
    });
  };

  const onBlurRitase = () => {
    const n = parseEnNumber(ritaseRateDisplay);
    setRitaseRateDisplay(
      n == null ? "" : formatRitase(Math.round(n * 1000) / 1000)
    );
  };

  const handleSaveData = async () => {
    if (!selectedCell) return;
    try {
      const loadingParsedS1 = parseEnNumber(loadingRateS1Display);
      const loadingParsedS2 = parseEnNumber(loadingRateS2Display);
      const ritaseParsed = parseEnNumber(ritaseRateDisplay);
      const loadingRate1 = loadingParsedS1 == null ? null : loadingParsedS1;
      const loadingRate2 = loadingParsedS2 == null ? null : loadingParsedS2;
      const ritaseRate =
        ritaseParsed == null ? null : Math.round(ritaseParsed * 1000) / 1000;

      const resolveSeq = (): number | null => {
        if (selectedCell?.columnSeq != null) return selectedCell.columnSeq;
        const key =
          displayIndexByDate[selectedCell.date]?.[selectedCell.vessel];
        if (typeof key === "string" && key.startsWith("seq:")) {
          const n = parseInt(key.slice(4), 10);
          if (Number.isFinite(n)) return n;
        }
        const matches = activeVesselEntries.filter(
          (e) => e.name === selectedCell.vessel
        );
        if (matches.length === 1 && matches[0].seq != null)
          return matches[0].seq as number;
        return null;
      };

      const postOne = async (
        shift: 1 | 2,
        loadingRate: number | null,
        ritase: number | null
      ) => {
        const seq = resolveSeq();
        if (seq == null) {
          throw new Error(
            "Kolom (seq) tidak diketahui. Klik ulang kolom lalu coba lagi."
          );
        }
        const response = await fetch("/api/loading-ritase-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedCell!.date,
            vesselName: selectedCell!.vessel,
            shift,
            loadingRate,
            ritaseRate: ritase,
            monthVesselSeq: seq,
          }),
        });
        const contentType = response.headers.get("content-type") ?? "";
        const body = contentType.includes("application/json")
          ? await response.json()
          : {};
        if (!response.ok) {
          const m = (body as any)?.message || `HTTP ${response.status}`;
          const d = (body as any)?.details ? `: ${(body as any).details}` : "";
          throw new Error(m + d);
        }
      };
      await postOne(1, loadingRate1, ritaseRate);
      await postOne(2, loadingRate2, null);

      // Update vessel status if it's completed or carry_over
      const vesselSeq = resolveSeq();
      const statusKey = `${selectedCell.vessel}_${vesselSeq || 1}`;
      const currentStatus = vesselStatuses[statusKey];
      
      if (currentStatus && currentStatus !== 'on_progress') {
        await fetch('/api/vessel-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vesselName: selectedCell.vessel,
            monthYear: selectedMonthYear,
            status: currentStatus,
            vesselSequence: vesselSeq || 1
          })
        });
      }

      await mutate();
      const myKey =
        selectedCell.columnSeq != null
          ? `seq:${selectedCell.columnSeq}`
          : (() => {
              const seq = resolveSeq();
              return seq != null ? `seq:${seq}` : undefined;
            })();
      if (myKey) {
        setDisplayIndexByDate((prev) => ({
          ...prev,
          [selectedCell.date]: {
            ...(prev[selectedCell.date] || {}),
            [selectedCell.vessel]: myKey,
          },
        }));
        try {
          localStorage.setItem(
            buildDisplayKey(selectedCell.date, selectedCell.vessel),
            myKey
          );
        } catch {}
      }
      setIsModalOpen(false);
      setSelectedCell(null);
      setLoadingRateS1Display("");
      setLoadingRateS2Display("");
      setRitaseRateDisplay("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan");
    }
  };

  const handleDeleteVessel = async (vesselName: string, seq?: number) => {
    if (!isShipping) return;
    try {
      // Delete vessel details first
      await fetch(`/api/vessel-details?vesselName=${encodeURIComponent(vesselName)}&monthYear=${encodeURIComponent(selectedMonthYear)}`, {
        method: "DELETE"
      });
      
      // Delete vessel status
      await fetch(`/api/vessel-status?vesselName=${encodeURIComponent(vesselName)}&monthYear=${encodeURIComponent(selectedMonthYear)}&vesselSequence=${seq || 1}`, {
        method: "DELETE"
      });
      
      // Update local state
      const statusKey = `${vesselName}_${seq || 1}`;
      setVesselStatuses(prev => {
        const newState = { ...prev };
        delete newState[statusKey];
        return newState;
      });
      
      // Then delete from month-vessels
      const res = await fetch("/api/month-vessels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear: selectedMonthYear, vesselName, seq }),
      });
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json() : {};
      if (!res.ok) {
        throw new Error((body as any)?.message || `HTTP ${res.status}`);
      }
      await mutateMonth();
      await mutate();
    } catch (e) {
      alert(
        e instanceof Error ? e.message : "Gagal menghapus kapal dari bulan ini"
      );
    }
  };

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return generateYearOptions(current - 5, current + 5);
  }, []);

  const [selectedYear, selectedMonth] = selectedMonthYear.split("-");

  const handleAddVessel = useCallback(async () => {
    const name = (addVesselForm.name || "").trim();
    if (!name) return;
    
    setIsAddingVessel(true);
    
    try {
      const existsInMaster = masterNames.some(
        (nm) => nm.toLowerCase() === name.toLowerCase()
      );
      if (!existsInMaster) {
        const addRes = await fetch("/api/vessels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vessel_name: name }),
        });
        if (!addRes.ok) {
          const b = await addRes.json().catch(() => ({}));
          throw new Error(
            (b as any)?.message || `HTTP ${addRes.status}`
          );
        }
      }

      // Save vessel details
      const vesselPayload = {
        vesselName: name,
        buyer: addVesselForm.buyer,
        rencanaMuat: addVesselForm.rencanaMuat,
        commencedLoadingDate: addVesselForm.commencedLoadingDate,
        commencedLoadingTime: addVesselForm.commencedLoadingTime,
        monthYear: selectedMonthYear
      };
      
      const vesselDetailsRes = await fetch("/api/vessel-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vesselPayload)
      });
      
      
      if (!vesselDetailsRes.ok) {
        const errorBody = await vesselDetailsRes.json().catch(() => ({}));
        console.error('Vessel details error:', errorBody);
      } else {
        const successBody = await vesselDetailsRes.json();
      }

      const payload: any = {
        monthYear: selectedMonthYear,
        vesselName: name,
      };
      setPendingMonthVessels((prev) => [...prev, name]);
      const res = await fetch("/api/month-vessels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json")
        ? await res.json()
        : {};
      if (!res.ok) {
        throw new Error(
          (body as any)?.message || `HTTP ${res.status}`
        );
      }
      const updatedEntries = await mutateMonth();
      await mutate();
      

      
      setPendingMonthVessels((prev) => {
        const arr = Array.isArray(updatedEntries)
          ? (updatedEntries as any[])
          : [];
        const hasInMapping = arr.some(
          (e) => (e?.name || e) === name
        );
        return hasInMapping
          ? prev.filter((n) => n !== name)
          : prev;
      });
      setIsAddMonthVesselOpen(false);
      setAddMonthVesselQuery("");
      setAddVesselForm({
        name: "",
        buyer: "",
        rencanaMuat: "",
        commencedLoadingDate: "",
        commencedLoadingTime: ""
      });
      setShowVesselSuggestions(false);
    } catch (e) {
      setPendingMonthVessels((prev) =>
        prev.filter((n) => n !== name)
      );
      alert(
        e instanceof Error
          ? e.message
          : "Gagal menambah kapal ke bulan ini"
      );
    } finally {
      setIsAddingVessel(false);
    }
  }, [addVesselForm, selectedMonthYear, masterNames, mutateMonth, mutate]);

  // Load vessel statuses
  useEffect(() => {
    const loadVesselStatuses = async () => {
      try {
        const response = await fetch(`/api/vessel-status?monthYear=${encodeURIComponent(selectedMonthYear)}`);
        const result = await response.json();
        const statusMap: Record<string, string> = {};
        if (result.data) {
          result.data.forEach((item: any) => {
            // Handle both new format (with _seq) and old format
            if (item.vessel_name.includes('_seq')) {
              const parts = item.vessel_name.split('_seq');
              const vesselName = parts[0];
              const seq = parseInt(parts[1]) || 1;
              const key = `${vesselName}_${seq}`;
              statusMap[key] = item.status;
            } else {
              // Old format or sequence 1
              const key = `${item.vessel_name}_1`;
              statusMap[key] = item.status;
            }
          });
        }
        setVesselStatuses(statusMap);
      } catch (error) {
        console.error('Failed to load vessel statuses:', error);
      }
    };
    loadVesselStatuses();
  }, [selectedMonthYear]);

  const updateVesselStatus = async (vesselName: string, status: string, vesselSeq?: number) => {
    try {
      const sequence = vesselSeq || 1;
      const statusKey = `${vesselName}_${sequence}`;
      
      if (status === 'on_progress') {
        // Delete from database if exists, only keep in local state
        await fetch(`/api/vessel-status?vesselName=${encodeURIComponent(vesselName)}&monthYear=${encodeURIComponent(selectedMonthYear)}&vesselSequence=${sequence}`, {
          method: 'DELETE'
        });
      } else {
        // Save to database for completed/carry_over status
        await fetch('/api/vessel-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vesselName,
            monthYear: selectedMonthYear,
            status,
            vesselSequence: sequence
          })
        });
      }
      
      setVesselStatuses(prev => ({ ...prev, [statusKey]: status }));
    } catch (error) {
      console.error('Failed to update vessel status:', error);
    }
  };

  if (roleLoading || vesselsLoading || dataLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f2f7" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (vesselsError) return <div>Error loading vessels: {vesselsError}</div>;
  if (dataError) return <div>Error loading data: {dataError}</div>;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f2f7" }}>
      <Sidebar onTabChange={() => {}} />
        <div className="flex-1 overflow-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-lg font-bold">
              {`LOADING RATE ${monthLabel(selectedMonthYear).toUpperCase()}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedMonthYear((prev) => getPrevMonthYear(prev))
                }
              >
                {"<"} Prev
              </Button>

              <div className="flex items-center gap-2">
                <Label htmlFor="month-select">Bulan:</Label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonthYear(
                      buildMonthYear(e.target.value, selectedYear)
                    )
                  }
                  className="p-2 border rounded"
                >
                  {MONTHS_ID.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="year-select">Tahun:</Label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedMonthYear(
                      buildMonthYear(selectedMonth, e.target.value)
                    )
                  }
                  className="p-2 border rounded"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setSelectedMonthYear((prev) => getNextMonthYear(prev))
                }
              >
                Next {">"}
              </Button>
            </div>

            {dataLoading && <div>Loading data...</div>}

            <div className="overflow-auto max-h-[70vh] relative">
              <div className="min-w-max">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="sticky top-0 z-30 bg-white">
                    <tr>
                      <th
                        className="border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold min-w-20 sticky left-0 top-0 z-30"
                        rowSpan={2}
                      >
                        Tanggal
                      </th>
                      {activeVesselEntries.map((entry, vIdx) => {
                        const vessel = entry.name;
                        const seq = entry.seq;
                        
                        const statusKey = `${vessel}_${seq || 1}`;
                        const vesselStatus = vesselStatuses[statusKey] || "on_progress";
                        const getHeaderColor = () => {
                          if (vesselStatus === "completed") return "bg-green-200";
                          if (vesselStatus === "carry_over_to_next_month") return "bg-red-200";
                          return "bg-yellow-200"; // on_progress or default
                        };
                        
                        return (
                          <th
                            key={`${vessel}-${vIdx}`}
                            className={`border border-gray-300 ${getHeaderColor()} p-2 text-xs font-semibold sticky top-0 z-10`}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-1">
                                <div
                                  className="whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-blue-600 hover:underline"
                                  title={`${vessel} - Klik untuk detail kapal`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleVesselNameClick(vessel);
                                  }}
                                >
                                  {vessel}
                                </div>
                                {isShipping ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      className="h-6 w-6 flex items-center justify-center rounded bg-white hover:bg-gray-50 border"
                                      title="Hapus kapal ini dari bulan ini"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        await handleDeleteVessel(vessel, seq);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                              {isShipping ? (
                                <select
                                  value={vesselStatus}
                                  onChange={(e) => updateVesselStatus(vessel, e.target.value, seq)}
                                  className="text-xs p-1 border rounded bg-white"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="on_progress">On Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="carry_over_to_next_month">Carry Over</option>
                                </select>
                              ) : (
                                <div className="text-xs px-2 py-1 rounded bg-gray-100 border">
                                  {vesselStatus === "completed" ? "Completed" : 
                                   vesselStatus === "carry_over_to_next_month" ? "Carry Over" : 
                                   "On Progress"}
                                </div>
                              )}
                            </div>
                          </th>
                        );
                      })}
                      <th
                        className="border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold sticky top-0 z-20"
                        rowSpan={2}
                        style={{ minWidth: "fit-content", width: "auto" }}
                      >
                        <div className="whitespace-nowrap">
                          TOTAL LOADING RATE (HARIAN)
                        </div>
                      </th>
                      <th
                        className="border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold sticky top-0 z-20"
                        rowSpan={2}
                        style={{ minWidth: "fit-content", width: "auto" }}
                      >
                        <div className="whitespace-nowrap">
                          TOTAL RITASE RATE (HARIAN)
                        </div>
                      </th>
                      <th
                        className="border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold min-w-16 sticky top-0 z-20"
                        rowSpan={2}
                      >
                        {isShipping ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAddMonthVesselOpen(true)}
                            className="h-6 w-6 p-0 bg-white hover:bg-gray-50"
                            title="Tambah kapal ke bulan ini"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dates.map((date, dateIndex) => (
                      <tr key={dateIndex}>
                        <td
                          className={`border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold text-center sticky left-0 z-20 cursor-pointer bg-yellow-200 ${
                            selectedRowDate === date
                              ? "ring-2 ring-blue-500 ring-inset"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedRowDate((prev) =>
                              prev === date ? null : date
                            )
                          }
                          title="Klik untuk menandai baris tanggal ini"
                        >
                          {date}
                        </td>
                        {(() => {
                          return activeVesselEntries.map((entry, vIdx) => {
                            const vesselName = entry.name;
                            const value = getCellValue(
                              date,
                              vesselName,
                              entry.seq ?? null
                            );
                            const hasData =
                              !!value &&
                              ((value.s1.loadingRate != null &&
                                value.s1.loadingRate !== 0) ||
                                (value.s2.loadingRate != null &&
                                  value.s2.loadingRate !== 0) ||
                                value.s1.ritaseRate != null ||
                                value.s2.ritaseRate != null);
                            const shouldShow = hasData;
                            return (
                              <td
                                key={`${date}-${vIdx}`}
                                className={`border border-gray-300 p-1 text-xs text-center ${
                                  shouldShow
                                    ? "bg-green-500 text-white"
                                    : "bg-white"
                                } cursor-pointer hover:opacity-80 ${
                                  selectedRowDate === date
                                    ? "ring-2 ring-blue-500 ring-inset"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(date, vesselName, entry.seq)
                                }
                              >
                                {/* indikator warna saja */}
                              </td>
                            );
                          });
                        })()}
                        {(() => {
                          const totalR = calculateTotalRitaseForDate(
                            date,
                            activeVessels
                          );
                          const hasTotal = totalR > 0;
                          return (
                            <>
                              <td
                                className={`border border-gray-300 p-1 text-xs text-center ${
                                  hasTotal
                                    ? "bg-green-300 text-black"
                                    : "bg-white"
                                } ${
                                  selectedRowDate === date
                                    ? "ring-2 ring-blue-500 ring-inset"
                                    : ""
                                }`}
                              >
                                {hasTotal ? formatRitase(totalR) : ""}
                              </td>
                              <td
                                className={`border border-gray-300 p-1 text-xs text-center ${(() => {
                                  const totalL = calculateTotalLoadingForDate(
                                    date,
                                    activeVessels
                                  );
                                  return totalL > 0
                                    ? "bg-blue-500 text-white"
                                    : "bg-white";
                                })()} ${
                                  selectedRowDate === date
                                    ? "ring-2 ring-blue-500 ring-inset"
                                    : ""
                                }`}
                              >
                                {(() => {
                                  const totalL = calculateTotalLoadingForDate(
                                    date,
                                    activeVessels
                                  );
                                  return totalL > 0
                                    ? formatLoading(totalL)
                                    : "";
                                })()}
                              </td>
                              <td
                                className={`border border-gray-300 p-1 text-xs text-center bg-white min-w-16 ${
                                  selectedRowDate === date
                                    ? "ring-2 ring-blue-500 ring-inset"
                                    : ""
                                }`}
                              />
                            </>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold text-center sticky left-0 z-10">
                        Total
                      </td>
                      {(() => {
                        return activeVesselEntries.map((entry, vIdx) => {
                          const vesselName = entry.name;
                          let sumRitase = 0;
                          for (const d of dates) {
                            const rowAny = (loadingMonthlyData as any)?.[d];
                            const byName = rowAny
                              ? (rowAny as any)[vesselName]
                              : undefined;
                            const bySeq =
                              byName && entry.seq != null
                                ? (byName as any)[entry.seq]
                                : undefined;
                            if (!bySeq) continue;
                            const r =
                              bySeq.s1?.ritaseRate ?? bySeq.s2?.ritaseRate ?? 0;
                            sumRitase += r;
                          }
                          return (
                            <td
                              key={`ritase-per-kapal-${vIdx}`}
                              className="border border-gray-300 p-1 text-xs text-center bg-yellow-300"
                            >
                              {sumRitase > 0 ? formatRitase(sumRitase) : ""}
                            </td>
                          );
                        });
                      })()}
                      <td className="border border-gray-300 p-1 text-xs text-center bg-white"></td>
                      <td className="border border-gray-300 p-1 text-xs text-center bg-white"></td>
                      <td className="border border-gray-300 p-1 text-xs text-center bg-white"></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 bg-yellow-200 p-2 text-xs font-semibold text-center sticky left-0 z-10">
                        Truck Factor
                      </td>
                      {(() => {
                        return activeVesselEntries.map((entry, vIdx) => {
                          const vesselName = entry.name;
                          let sumLoading = 0;
                          let sumRitase = 0;
                          for (const d of dates) {
                            const rowAny = (loadingMonthlyData as any)?.[d];
                            const byName = rowAny
                              ? (rowAny as any)[vesselName]
                              : undefined;
                            const bySeq =
                              byName && entry.seq != null
                                ? (byName as any)[entry.seq]
                                : undefined;
                            if (!bySeq) continue;
                            sumLoading +=
                              (bySeq.s1?.loadingRate ?? 0) +
                              (bySeq.s2?.loadingRate ?? 0);
                            const r =
                              bySeq.s1?.ritaseRate ?? bySeq.s2?.ritaseRate ?? 0;
                            sumRitase += r;
                          }
                          const tf =
                            sumLoading > 0
                              ? Math.round((sumRitase / sumLoading) * 1000) /
                                1000
                              : null;
                          return (
                            <td
                              key={`tf-row-${vIdx}`}
                              className="border border-gray-300 p-1 text-xs text-center bg-orange-300"
                            >
                              {tf != null ? formatRitase(tf) : ""}
                            </td>
                          );
                        });
                      })()}
                      <td className="border border-gray-300 p-1 text-xs text-center bg-white"></td>
                      <td className="border border-gray-300 p-1 text-xs text-center bg-white"></td>
                      <td className="border border-gray-300 p-1 text-xs text-center bg-white"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Input Data - {selectedCell?.vessel} ({selectedCell?.date})
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="loadingRate1">Ritase Rate (Shift 1)</Label>
                    <Input
                      ref={s1Ref}
                      id="loadingRate1"
                      type="text"
                      inputMode="decimal"
                      value={loadingRateS1Display}
                      onChange={(e) =>
                        onChangeDecimalLive(e, setLoadingRateS1Display, s1Ref)
                      }
                      onBlur={() =>
                        setLoadingRateS1Display(
                          formatLoading(parseEnNumber(loadingRateS1Display))
                        )
                      }
                      placeholder='Contoh: 1,234.567 ("," ribuan, "." desimal)'
                      disabled={!isShipping}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loadingRate2">Ritase Rate (Shift 2)</Label>
                    <Input
                      ref={s2Ref}
                      id="loadingRate2"
                      type="text"
                      inputMode="decimal"
                      value={loadingRateS2Display}
                      onChange={(e) =>
                        onChangeDecimalLive(e, setLoadingRateS2Display, s2Ref)
                      }
                      onBlur={() =>
                        setLoadingRateS2Display(
                          formatLoading(parseEnNumber(loadingRateS2Display))
                        )
                      }
                      placeholder='Contoh: 1,234.567 ("," ribuan, "." desimal)'
                      disabled={!isShipping}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ritaseRate">Loading Rate</Label>
                    <Input
                      ref={ritRef}
                      id="ritaseRate"
                      type="text"
                      inputMode="decimal"
                      value={ritaseRateDisplay}
                      onChange={(e) =>
                        onChangeDecimalLive(e, setRitaseRateDisplay, ritRef)
                      }
                      onBlur={onBlurRitase}
                      placeholder="Contoh: 6,908.000 (3 desimal tetap)"
                      disabled={!isShipping}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Tutup
                    </Button>
                    {isShipping ? (
                      <Button
                        variant="default"
                        onClick={handleSaveData}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        Simpan
                      </Button>
                    ) : null}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isVesselDetailOpen} onOpenChange={setIsVesselDetailOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Detail Kapal - {vesselDetailForm.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vesselName">Nama Kapal</Label>
                    <Input
                      id="vesselName"
                      type="text"
                      value={vesselDetailForm.name}
                      onChange={(e) => setVesselDetailForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isShipping}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer">Nama Buyer</Label>
                    <Input
                      id="buyer"
                      type="text"
                      value={vesselDetailForm.buyer}
                      onChange={(e) => setVesselDetailForm(prev => ({ ...prev, buyer: e.target.value }))}
                      placeholder="Masukkan nama buyer"
                      disabled={!isShipping}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rencanaMuat">Rencana Muat</Label>
                    <Input
                      id="rencanaMuat"
                      type="text"
                      inputMode="decimal"
                      value={vesselDetailForm.rencanaMuat}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = raw.split('.');
                        let formatted = '';
                        if (parts[0]) {
                          formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        }
                        if (parts.length > 1) {
                          formatted += '.' + parts[1].slice(0, 3);
                        }
                        setVesselDetailForm(prev => ({ ...prev, rencanaMuat: formatted }));
                      }}
                      placeholder="Masukkan rencana muat (contoh: 1,000.000)"
                      disabled={!isShipping}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commencedDate">Tanggal Commenced Loading</Label>
                    <Input
                      id="commencedDate"
                      type="date"
                      value={vesselDetailForm.commencedLoadingDate}
                      onChange={(e) => setVesselDetailForm(prev => ({ ...prev, commencedLoadingDate: e.target.value }))}
                      disabled={!isShipping}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commencedTime">Jam Commenced Loading</Label>
                    <Input
                      id="commencedTime"
                      type="time"
                      value={vesselDetailForm.commencedLoadingTime}
                      onChange={(e) => setVesselDetailForm(prev => ({ ...prev, commencedLoadingTime: e.target.value }))}
                      disabled={!isShipping}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsVesselDetailOpen(false)}
                    >
                      Tutup
                    </Button>
                    {isShipping ? (
                      <Button
                        variant="default"
                        onClick={handleSaveVesselDetail}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        Simpan
                      </Button>
                    ) : null}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isAddMonthVesselOpen}
              onOpenChange={(open) => {
                if (!isAddingVessel) {
                  setIsAddMonthVesselOpen(open);
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Tambah Kapal ke Bulan {monthLabel(selectedMonthYear)}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="mvName">Nama Kapal <span className="text-red-500">*</span></Label>
                    <Input
                      id="mvName"
                      type="text"
                      placeholder="Ketik nama kapal..."
                      value={addVesselForm.name}
                      onChange={(e) => {
                        setAddVesselForm(prev => ({ ...prev, name: e.target.value }));
                        setAddMonthVesselQuery(e.target.value);
                        setShowVesselSuggestions(true);
                        if (e.target.value.trim()) setAddVesselErrors(prev => ({ ...prev, name: undefined }));
                      }}
                      onFocus={() => setShowVesselSuggestions(true)}
                      autoComplete="off"
                      className={addVesselErrors.name ? "border-red-500" : ""}
                    />
                    {addVesselErrors.name && <p className="text-xs text-red-500">{addVesselErrors.name}</p>}
                    {showVesselSuggestions && addVesselForm.name && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto border bg-white rounded shadow text-xs">
                        {masterNames
                          .filter((nm) =>
                            nm
                              .toLowerCase()
                              .includes(addVesselForm.name.toLowerCase())
                          )
                          .slice(0, 20)
                          .map((nm) => (
                            <div
                              key={nm}
                              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setAddVesselForm(prev => ({ ...prev, name: nm }));
                                setAddMonthVesselQuery(nm);
                                setShowVesselSuggestions(false);
                              }}
                            >
                              {nm}
                            </div>
                          ))}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500">
                      Bisa ketik nama baru; jika belum ada di master akan
                      ditambahkan otomatis.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addBuyer">Nama Buyer <span className="text-red-500">*</span></Label>
                    <Input
                      id="addBuyer"
                      type="text"
                      value={addVesselForm.buyer}
                      onChange={(e) => {
                        setAddVesselForm(prev => ({ ...prev, buyer: e.target.value }));
                        if (e.target.value.trim()) setAddVesselErrors(prev => ({ ...prev, buyer: undefined }));
                      }}
                      placeholder="Masukkan nama buyer"
                      autoComplete="off"
                      className={addVesselErrors.buyer ? "border-red-500" : ""}
                    />
                    {addVesselErrors.buyer && <p className="text-xs text-red-500">{addVesselErrors.buyer}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addRencanaMuat">Rencana Muat</Label>
                    <Input
                      id="addRencanaMuat"
                      type="text"
                      inputMode="decimal"
                      value={addVesselForm.rencanaMuat}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = raw.split('.');
                        let formatted = '';
                        if (parts[0]) {
                          formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        }
                        if (parts.length > 1) {
                          formatted += '.' + parts[1].slice(0, 3);
                        }
                        setAddVesselForm(prev => ({ ...prev, rencanaMuat: formatted }));
                      }}
                      placeholder="Masukkan rencana muat (contoh: 1,000.000)"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addCommencedDate">Tanggal Commenced Loading</Label>
                    <Input
                      id="addCommencedDate"
                      type="date"
                      value={addVesselForm.commencedLoadingDate}
                      onChange={(e) => setAddVesselForm(prev => ({ ...prev, commencedLoadingDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addCommencedTime">Jam Commenced Loading</Label>
                    <Input
                      id="addCommencedTime"
                      type="time"
                      value={addVesselForm.commencedLoadingTime}
                      onChange={(e) => setAddVesselForm(prev => ({ ...prev, commencedLoadingTime: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={isAddingVessel}
                      onClick={() => {
                        setIsAddMonthVesselOpen(false);
                        setAddVesselForm({
                          name: "",
                          buyer: "",
                          rencanaMuat: "",
                          commencedLoadingDate: "",
                          commencedLoadingTime: ""
                        });
                        setAddVesselErrors({});
                        setAddMonthVesselQuery("");
                        setShowVesselSuggestions(false);
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      className="bg-black text-white hover:bg-gray-800"
                      disabled={isAddingVessel}
                      onClick={async () => {
                        const name = (addVesselForm.name || "").trim();
                        const buyer = (addVesselForm.buyer || "").trim();
                        const errors: { name?: string; buyer?: string } = {};
                        if (!name) errors.name = "Nama kapal wajib diisi";
                        if (!buyer) errors.buyer = "Nama buyer wajib diisi";
                        if (Object.keys(errors).length > 0) { setAddVesselErrors(errors); return; }
                        setAddVesselErrors({});
                        setIsAddingVessel(true);
                        
                        try {
                          const existsInMaster = masterNames.some(
                            (nm) => nm.toLowerCase() === name.toLowerCase()
                          );
                          if (!existsInMaster) {
                            const addRes = await fetch("/api/vessels", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ vessel_name: name }),
                            });
                            if (!addRes.ok) {
                              const b = await addRes.json().catch(() => ({}));
                              throw new Error(
                                (b as any)?.message || `HTTP ${addRes.status}`
                              );
                            }
                          }

                          const vesselPayload = {
                            vesselName: name,
                            buyer: addVesselForm.buyer,
                            rencanaMuat: addVesselForm.rencanaMuat,
                            commencedLoadingDate: addVesselForm.commencedLoadingDate,
                            commencedLoadingTime: addVesselForm.commencedLoadingTime,
                            monthYear: selectedMonthYear
                          };
                          
                          const vesselDetailsRes = await fetch("/api/vessel-details", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(vesselPayload)
                          });

                          const payload: any = {
                            monthYear: selectedMonthYear,
                            vesselName: name,
                          };
                          setPendingMonthVessels((prev) => [...prev, name]);
                          const res = await fetch("/api/month-vessels", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });
                          const ct = res.headers.get("content-type") || "";
                          const body = ct.includes("application/json")
                            ? await res.json()
                            : {};
                          if (!res.ok) {
                            throw new Error(
                              (body as any)?.message || `HTTP ${res.status}`
                            );
                          }
                          const updatedEntries = await mutateMonth();
                          await mutate();
                          

                          
                          setPendingMonthVessels((prev) => {
                            const arr = Array.isArray(updatedEntries)
                              ? (updatedEntries as any[])
                              : [];
                            const hasInMapping = arr.some(
                              (e) => (e?.name || e) === name
                            );
                            return hasInMapping
                              ? prev.filter((n) => n !== name)
                              : prev;
                          });
                          setIsAddMonthVesselOpen(false);
                          setAddMonthVesselQuery("");
                          setAddVesselForm({
                            name: "",
                            buyer: "",
                            rencanaMuat: "",
                            commencedLoadingDate: "",
                            commencedLoadingTime: ""
                          });
                          setShowVesselSuggestions(false);
                        } catch (e) {
                          setPendingMonthVessels((prev) =>
                            prev.filter((n) => n !== name)
                          );
                          alert(
                            e instanceof Error
                              ? e.message
                              : "Gagal menambah kapal ke bulan ini"
                          );
                        } finally {
                          setIsAddingVessel(false);
                        }
                      }}
                    >
                      {isAddingVessel ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Menyimpan...
                        </div>
                      ) : (
                        "Simpan"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        </div>
    </div>
  );
}