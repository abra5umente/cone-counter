export interface Cone {
  id: number;
  timestamp: string;
  date: string;
  time: string;
  dayOfWeek: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConeStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  averagePerDay: number;
  averagePerWeek: number;
  averagePerMonth: number;
}

export interface TimeAnalysis {
  hourOfDay: { [hour: number]: number };
  dayOfWeek: { [day: string]: number };
  monthOfYear: { [month: number]: number };
}

export interface ExportData {
  cones: Cone[];
  exportDate: string;
  version: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
}
