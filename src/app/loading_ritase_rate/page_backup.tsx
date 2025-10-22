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
import { useAuth } from "../providers/auth_provider";
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
  const { user } = useAuth();
  const bureu = ((): string | null => {
    try {
      const root = user as any;
      return (
        (
          (root?.app_metadata?.bureu as string) ||
          (root?.user_metadata?.bureu as string) ||
          (root?.raw_app_meta_data?.bureu as string) ||
          (root?.raw_user_meta_data?.bureu as string) ||
          null
        )?.toLowerCase?.() ?? null
      );
    } catch {
      return null;
    }
  })();
  const isShipping = bureu === "shipping";
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
  const [displayIndexByDate, setDisplayIndexByDate] = useState<
    Record<string, Record<string, string>>
  >({});
  const [dragInfo, setDragInfo] = useState<{
    seq?: number;
    vIdx: number;
  } | null>(null);

  // State untuk modal detail kapal
  const [isVesselDetailOpen, setIsVesselDetailOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<{
    name: string;
    buyer: string;
    rencanaMuat: string;
    commencedLoadingDate: string;
    commencedLoadingTime: string;
  } | null>(null);
  const [vesselDetailForm, setVesselDetailForm] = useState({
    name: "",
    buyer: "",
    rencanaMuat: "",
    commencedLoadingDate: "",
    commencedLoadingTime: ""
  });

  if (vesselsLoading || dataLoading) {
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
    <div className="min-h-screen">
      <div className="flex">
        <Sidebar onTabChange={() => {}} />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-lg font-bold">
              {`LOADING RATE ${monthLabel(selectedMonthYear).toUpperCase()}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>Loading Rate Table Content</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}