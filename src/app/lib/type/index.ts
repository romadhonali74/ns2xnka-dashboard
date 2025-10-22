// types/index.ts
export interface Vessel {
  id: number;
  vessel_name: string;
  vessel_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoadingRitaseRate {
  id: number;
  vessel_id: number;
  loading_date: string;
  loading_rate: number | null;
  ritase_rate: number | null;
  month_year: string;
  created_at: string;
  updated_at: string;
}

// Response dari Supabase dengan join vessels
export interface SupabaseLoadingRitaseResponse {
  loading_rate: number | null;
  ritase_rate: number | null;
  vessels: {
    vessel_name: string;
  } | null;
}

// Format response untuk frontend
export interface CellValue {
  loadingRate: number | null;
  ritaseRate: number | null;
}

export interface LoadingDataResponse {
  [vesselName: string]: CellValue;
}

export interface UpdateLoadingDataRequest {
  date: string;
  vesselName: string;
  loadingRate: number | null;
  ritaseRate: number | null;
}

// Type guards
export const isSupabaseLoadingRitaseResponse = (data: unknown): data is SupabaseLoadingRitaseResponse => {
  if (!data || typeof data !== 'object') return false;
  
  const response = data as Record<string, unknown>;
  return (
    (response.loading_rate === null || typeof response.loading_rate === 'number') &&
    (response.ritase_rate === null || typeof response.ritase_rate === 'number') &&
    (response.vessels === null || typeof response.vessels === 'object')
  );
};

export const isValidCellValue = (value: unknown): value is CellValue => {
  if (!value || typeof value !== 'object') return false;
  
  const cellValue = value as Record<string, unknown>;
  return (
    (cellValue.loadingRate === null || typeof cellValue.loadingRate === 'number') &&
    (cellValue.ritaseRate === null || typeof cellValue.ritaseRate === 'number')
  );
};