import { Cone, ConeStats, TimeAnalysis, ExportData, ImportResult } from './types';

const API_BASE = process.env.REACT_APP_API_URL || '';

export class ConeAPI {
  static async getAllCones(): Promise<Cone[]> {
    const response = await fetch(`${API_BASE}/api/cones`);
    if (!response.ok) throw new Error('Failed to fetch cones');
    return response.json();
  }

  static async getCone(id: number): Promise<Cone> {
    const response = await fetch(`${API_BASE}/api/cones/${id}`);
    if (!response.ok) throw new Error('Failed to fetch cone');
    return response.json();
  }

  static async addCone(timestamp?: string, notes?: string): Promise<Cone> {
    const response = await fetch(`${API_BASE}/api/cones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp, notes })
    });
    if (!response.ok) throw new Error('Failed to add cone');
    return response.json();
  }

  static async updateCone(id: number, updates: Partial<Cone>): Promise<Cone> {
    const response = await fetch(`${API_BASE}/api/cones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update cone');
    return response.json();
  }

  static async deleteCone(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/api/cones/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete cone');
  }

  static async getStats(): Promise<ConeStats> {
    const response = await fetch(`${API_BASE}/api/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  static async getAnalysis(): Promise<TimeAnalysis> {
    const response = await fetch(`${API_BASE}/api/analysis`);
    if (!response.ok) throw new Error('Failed to fetch analysis');
    return response.json();
  }

  static async exportData(): Promise<ExportData> {
    const response = await fetch(`${API_BASE}/api/export`);
    if (!response.ok) throw new Error('Failed to export data');
    return response.json();
  }

  static async importData(data: ExportData): Promise<ImportResult> {
    const response = await fetch(`${API_BASE}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to import data');
    return response.json();
  }

  static async getConesByDateRange(startDate: string, endDate: string): Promise<Cone[]> {
    const response = await fetch(`${API_BASE}/api/cones/range/${startDate}/${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch cones by date range');
    return response.json();
  }
}
