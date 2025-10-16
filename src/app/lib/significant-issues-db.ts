// lib/significant-issues-db.ts

export interface SignificantIssue {
  no: number;
  tanggal: string;
  keterangan: string;
}

let issues: SignificantIssue[] = [
  {
    no: 1,
    tanggal: "2 May",
    keterangan:
      "18:35-19:00 LT, 19:00-19:40, Hujan (BG. TGH 3651 & BG. PB 3101)",
  },
  {
    no: 2,
    tanggal: "7 May",
    keterangan:
      "19:00-21:00 LT, Awal kegiatan Exca 239 kerusakan dalam tongkang (BG. MEGA VICTORY)",
  },
  {
    no: 3,
    tanggal: "9 May",
    keterangan: "19:25-23:30 LT, Hujan (BG. SEGARA 63 & BG. MP 330 11)",
  },
  {
    no: 4,
    tanggal: "14 May",
    keterangan: "13:35-17:25 LT, Hujan (BG. PB 3101 & BG. WIRATIMUR 3006)",
  },
  {
    no: 5,
    tanggal: "16 May",
    keterangan: "14:50-16:00 LT, Hujan (BG. WIRATIMUR 3006 & BG. MP 330 19)",
  },
];

let nextId = issues.length > 0 ? Math.max(...issues.map((i) => i.no)) + 1 : 1;

export const getIssues = (): SignificantIssue[] => issues;

export const getIssueById = (no: number): SignificantIssue | undefined =>
  issues.find((issue) => issue.no === no);

export const addIssue = (
  newIssue: Omit<SignificantIssue, "no">
): SignificantIssue => {
  const issueWithId = { ...newIssue, no: nextId++ };
  issues.push(issueWithId);
  return issueWithId;
};

export const updateIssue = (
  no: number,
  updatedFields: Partial<SignificantIssue>
): SignificantIssue | undefined => {
  const index = issues.findIndex((issue) => issue.no === no);
  if (index !== -1) {
    issues[index] = { ...issues[index], ...updatedFields };
    return issues[index];
  }
  return undefined;
};

export const deleteIssue = (no: number): boolean => {
  const initialLength = issues.length;
  issues = issues.filter((issue) => issue.no !== no);
  return issues.length < initialLength;
};
