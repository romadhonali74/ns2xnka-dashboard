// types/typeGuards.ts
import { CellValue } from "./index";

export const isValidCellValue = (value: unknown): value is CellValue => {
  if (!value || typeof value !== 'object') return false;
  
  const cellValue = value as Record<string, unknown>;
  const hasValidLoadingRate = cellValue.loadingRate === null || typeof cellValue.loadingRate === 'number';
  const hasValidRitaseRate = cellValue.ritaseRate === null || typeof cellValue.ritaseRate === 'number';
  
  return hasValidLoadingRate && hasValidRitaseRate;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};