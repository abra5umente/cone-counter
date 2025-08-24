import { Cone, ConeStats, TimeAnalysis, ExportData, ImportResult } from './types';
import { getFirebaseAuth } from './firebase';

// More robust API base that works better on mobile devices
const getAPIBase = () => {
  // If we're in development (localhost), use the dev server
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // For production, use the same origin as the current page
  // This handles cases where the app might be served from different subdomains or ports
  return window.location.origin;
};

// Helper function to get auth headers with retry logic
async function getAuthHeaders(retryCount = 0): Promise<HeadersInit> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase not initialized');
    }
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the Firebase ID token with retry logic
    let token: string;
    try {
      token = await user.getIdToken(true); // Force refresh for mobile reliability
    } catch (tokenError) {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return getAuthHeaders(retryCount + 1);
      }
      throw tokenError;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    return headers;
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    throw error;
  }
}

// Enhanced fetch with retry logic and better error handling
async function fetchWithRetry(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If we get a 401, try refreshing the token once
    if (response.status === 401 && retryCount === 0) {
      const newHeaders = await getAuthHeaders(1);
      const newOptions = { ...options, headers: newHeaders };
      return fetchWithRetry(url, newOptions, retryCount + 1);
    }
    
    return response;
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
}

export class ConeAPI {
  static async getAllCones(): Promise<Cone[]> {
    const url = `${getAPIBase()}/api/cones`;
    const headers = await getAuthHeaders();
    
    try {
      const response = await fetchWithRetry(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cones:', response.status, errorText);
        throw new Error(`Failed to fetch cones: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in getAllCones:', error);
      throw error;
    }
  }

  static async getCone(id: string): Promise<Cone> {
    const url = `${getAPIBase()}/api/cones/${id}`;
    console.log('Fetching cone from:', url);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cone:', response.status, errorText);
        throw new Error(`Failed to fetch cone: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in getCone:', error);
      throw error;
    }
  }

  static async addCone(timestamp?: string, notes?: string): Promise<Cone> {
    const url = `${getAPIBase()}/api/cones`;
    console.log('Adding cone to:', url);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ timestamp, notes })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add cone:', response.status, errorText);
        throw new Error(`Failed to add cone: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in addCone:', error);
      throw error;
    }
  }

  static async updateCone(id: string, updates: Partial<Cone>): Promise<Cone> {
    const url = `${getAPIBase()}/api/cones/${id}`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update cone:', response.status, errorText);
        throw new Error(`Failed to update cone: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in updateCone:', error);
      throw error;
    }
  }

  static async deleteCone(id: string): Promise<void> {
    const url = `${getAPIBase()}/api/cones/${id}`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete cone:', response.status, errorText);
        throw new Error(`Failed to delete cone: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in deleteCone:', error);
      throw error;
    }
  }

  static async getStats(): Promise<ConeStats> {
    const url = `${getAPIBase()}/api/stats`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch stats:', response.status, errorText);
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  static async getAnalysis(): Promise<TimeAnalysis> {
    const url = `${getAPIBase()}/api/analysis`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch analysis:', response.status, errorText);
        throw new Error(`Failed to fetch analysis: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in getAnalysis:', error);
      throw error;
    }
  }

  static async exportData(): Promise<ExportData> {
    const url = `${getAPIBase()}/api/export`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to export data:', response.status, errorText);
        throw new Error(`Failed to export data: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in exportData:', error);
      throw error;
    }
  }

  static async importData(data: ExportData): Promise<ImportResult> {
    const url = `${getAPIBase()}/api/import`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to import data:', response.status, errorText);
        throw new Error(`Failed to import data: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in importData:', error);
      throw error;
    }
  }

  static async getConesByDateRange(startDate: string, endDate: string): Promise<Cone[]> {
    const url = `${getAPIBase()}/api/cones/range/${startDate}/${endDate}`;
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cones by date range:', response.status, errorText);
        throw new Error(`Failed to fetch cones by date range: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in getConesByDateRange:', error);
      throw error;
    }
  }
}
