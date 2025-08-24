import { Cone, ConeStats, TimeAnalysis, ExportData, ImportResult } from './types';
import { getFirebaseAuth } from './firebase';

// Dynamic API base that works from any device and respects the current protocol
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : `${window.location.protocol}//${window.location.hostname}`;

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get the Firebase ID token
  const token = await user.getIdToken();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export class ConeAPI {
  static async getAllCones(): Promise<Cone[]> {
    const url = `${API_BASE}/api/cones`;
    console.log('Fetching cones from:', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch cones');
    return response.json();
  }

  static async getCone(id: string): Promise<Cone> {
    const url = `${API_BASE}/api/cones/${id}`;
    console.log('Fetching cone from:', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch cone');
    return response.json();
  }

  static async addCone(timestamp?: string, notes?: string): Promise<Cone> {
    const url = `${API_BASE}/api/cones`;
    console.log('Adding cone to:', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ timestamp, notes })
    });
    if (!response.ok) throw new Error('Failed to add cone');
    return response.json();
  }

  static async updateCone(id: string, updates: Partial<Cone>): Promise<Cone> {
    const url = `${API_BASE}/api/cones/${id}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update cone');
    return response.json();
  }

  static async deleteCone(id: string): Promise<void> {
    const url = `${API_BASE}/api/cones/${id}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete cone');
  }

  static async getStats(): Promise<ConeStats> {
    const url = `${API_BASE}/api/stats`;
    console.log('Fetching stats from:', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    console.log('Stats response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  static async getAnalysis(): Promise<TimeAnalysis> {
    const url = `${API_BASE}/api/analysis`;
    console.log('Fetching analysis from:', url);
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch analysis');
    return response.json();
  }

  static async exportData(): Promise<ExportData> {
    const url = `${API_BASE}/api/export`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to export data');
    return response.json();
  }

  static async importData(data: ExportData): Promise<ImportResult> {
    const url = `${API_BASE}/api/import`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to import data');
    return response.json();
  }

  static async getConesByDateRange(startDate: string, endDate: string): Promise<Cone[]> {
    const url = `${API_BASE}/api/cones/range/${startDate}/${endDate}`;
    const headers = await getAuthHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch cones by date range');
    return response.json();
  }
}
