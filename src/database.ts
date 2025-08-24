import { getFirestore } from 'firebase-admin/firestore';
import { Cone, ConeStats, TimeAnalysis, ExportData } from './types';

export class Database {
  private db: any;

  constructor() {
    this.db = getFirestore();
  }

  // User management methods
  async createUser(firebaseUid: string, email: string, displayName?: string): Promise<void> {
    const userRef = this.db.collection('users').doc(firebaseUid);
    await userRef.set({
      email,
      displayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async getUser(firebaseUid: string): Promise<{ id: string; email: string; displayName?: string } | null> {
    const userRef = this.db.collection('users').doc(firebaseUid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return null;
    
    const userData = userSnap.data();
    return {
      id: firebaseUid,
      email: userData.email,
      displayName: userData.displayName
    };
  }

  // Recalculate local derived fields (date, time, dayOfWeek) from ISO timestamp
  // Returns number of rows updated
  async normalizeDateFields(userId: string): Promise<number> {
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const computeFromTimestamp = (iso: string) => {
      const d = new Date(iso);
      const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      const dayOfWeek = days[d.getDay()];
      return { date, time, dayOfWeek };
    };

    const conesRef = this.db.collection('cones');
    const querySnapshot = await conesRef.where('userId', '==', userId).get();

    let updated = 0;
    const batch = this.db.batch();

    querySnapshot.forEach((docSnapshot: any) => {
      const data = docSnapshot.data();
      const calc = computeFromTimestamp(data.timestamp);
      
      if (calc.date !== data.date || calc.time !== data.time || calc.dayOfWeek !== data.dayOfWeek) {
        const coneRef = this.db.collection('cones').doc(docSnapshot.id);
        batch.update(coneRef, {
          date: calc.date,
          time: calc.time,
          dayOfWeek: calc.dayOfWeek,
          updatedAt: new Date().toISOString()
        });
        updated++;
      }
    });

    if (updated > 0) {
      await batch.commit();
    }

    return updated;
  }

  async addCone(userId: string, cone: Omit<Cone, 'id'>): Promise<string> {
    const conesRef = this.db.collection('cones');
    const docRef = await conesRef.add({
      ...cone,
      userId
    });
    return docRef.id;
  }

  async updateCone(userId: string, id: string, updates: Partial<Cone>): Promise<boolean> {
    const coneRef = this.db.collection('cones').doc(id);
    const coneSnap = await coneRef.get();
    
    if (!coneSnap.exists) return false;
    
    const coneData = coneSnap.data();
    if (coneData.userId !== userId) return false;

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await coneRef.update(updateData);
    return true;
  }

  async deleteCone(userId: string, id: string): Promise<boolean> {
    const coneRef = this.db.collection('cones').doc(id);
    const coneSnap = await coneRef.get();
    
    if (!coneSnap.exists) return false;
    
    const coneData = coneSnap.data();
    if (coneData.userId !== userId) return false;

    await coneRef.delete();
    return true;
  }

  async getCone(userId: string, id: string): Promise<Cone | null> {
    const coneRef = this.db.collection('cones').doc(id);
    const coneSnap = await coneRef.get();
    
    if (!coneSnap.exists) return null;
    
    const coneData = coneSnap.data();
    if (coneData.userId !== userId) return null;

    return {
      id: coneSnap.id,
      timestamp: coneData.timestamp,
      date: coneData.date,
      time: coneData.time,
      dayOfWeek: coneData.dayOfWeek,
      notes: coneData.notes,
      createdAt: coneData.createdAt,
      updatedAt: coneData.updatedAt
    };
  }

  async getAllCones(userId: string): Promise<Cone[]> {
    try {
      const conesRef = this.db.collection('cones');
      // First try with orderBy, if it fails due to missing index, fall back to simple query
      try {
        const querySnapshot = await conesRef.where('userId', '==', userId).orderBy('timestamp', 'desc').get();
        
        return querySnapshot.docs.map((docSnapshot: any) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            timestamp: data.timestamp,
            date: data.date,
            time: data.time,
            dayOfWeek: data.dayOfWeek,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        });
      } catch (orderByError) {
        // Fallback: get all cones and sort in memory
        const querySnapshot = await conesRef.where('userId', '==', userId).get();
        
        const cones = querySnapshot.docs.map((docSnapshot: any) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            timestamp: data.timestamp,
            date: data.date,
            time: data.time,
            dayOfWeek: data.dayOfWeek,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        });
        
        // Sort by timestamp descending in memory
        return cones.sort((a: Cone, b: Cone) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch (error) {
      throw error;
    }
  }

  async getConesByDateRange(userId: string, startDate: string, endDate: string): Promise<Cone[]> {
    try {
      const conesRef = this.db.collection('cones');
      // Try with orderBy first, fallback to simple query if index is missing
      try {
        const querySnapshot = await conesRef
          .where('userId', '==', userId)
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .orderBy('timestamp', 'desc')
          .get();
        
        return querySnapshot.docs.map((docSnapshot: any) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            timestamp: data.timestamp,
            date: data.date,
            time: data.time,
            dayOfWeek: data.dayOfWeek,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        });
      } catch (orderByError) {
        // Fallback: get all cones and filter/sort in memory
        const querySnapshot = await conesRef
          .where('userId', '==', userId)
          .where('date', '>=', startDate)
          .where('date', '<=', endDate)
          .get();
        
        const cones = querySnapshot.docs.map((docSnapshot: any) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            timestamp: data.timestamp,
            date: data.date,
            time: data.time,
            dayOfWeek: data.dayOfWeek,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        });
        
        // Sort by timestamp descending in memory
        return cones.sort((a: Cone, b: Cone) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch (error) {
      throw error;
    }
  }

  private async getMinDate(userId: string): Promise<string | null> {
    try {
      const conesRef = this.db.collection('cones');
      // Try with orderBy first, fallback to simple query if index is missing
      try {
        const querySnapshot = await conesRef
          .where('userId', '==', userId)
          .orderBy('date', 'asc')
          .limit(1)
          .get();
        
        if (querySnapshot.empty) return null;
        
        const firstDoc = querySnapshot.docs[0];
        return firstDoc.data().date;
      } catch (orderByError) {
        // Fallback: get all cones and find minimum date in memory
        const querySnapshot = await conesRef.where('userId', '==', userId).get();
        
        if (querySnapshot.empty) return null;
        
        let minDate: string | null = null;
        querySnapshot.forEach((docSnapshot: any) => {
          const data = docSnapshot.data();
          if (!minDate || data.date < minDate) {
            minDate = data.date;
          }
        });
        
        return minDate;
      }
    } catch (error) {
      throw error;
    }
  }

  async getStats(userId: string): Promise<ConeStats> {
    try {
      const now = new Date();
      const pad2 = (n: number) => String(n).padStart(2, '0');
      const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      
      // Get start of week (Monday)
      const startOfWeek = new Date(now);
      const weekday = (now.getDay() + 6) % 7; // Monday=0, Sunday=6
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - weekday);
      const weekStart = `${startOfWeek.getFullYear()}-${pad2(startOfWeek.getMonth() + 1)}-${pad2(startOfWeek.getDate())}`;
      
      // Get start of month
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [total, todayCount, weekCount, monthCount, minDateStr] = await Promise.all([
        this.getCount('userId', '==', userId),
        this.getCount('userId', '==', userId, 'date', '==', today),
        this.getCount('userId', '==', userId, 'date', '>=', weekStart),
        this.getCount('userId', '==', userId, 'date', '>=', monthStart),
        this.getMinDate(userId)
      ]);

      // Calculate averages
      let averagePerDay = 0;
      let averagePerWeek = 0;
      let averagePerMonth = 0;

      if (minDateStr && total > 0) {
        const startDate = new Date(minDateStr);
        const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const weeksDiff = Math.max(1, Math.ceil(daysDiff / 7));
        const monthsDiff = Math.max(1, Math.ceil(daysDiff / 30));

        averagePerDay = total / daysDiff;
        averagePerWeek = total / weeksDiff;
        averagePerMonth = total / monthsDiff;
      }

      return {
        total,
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        averagePerDay,
        averagePerWeek,
        averagePerMonth
      };
    } catch (error) {
      throw error;
    }
  }

  async getAnalysis(userId: string): Promise<TimeAnalysis> {
    const conesRef = this.db.collection('cones');
    const querySnapshot = await conesRef.where('userId', '==', userId).get();
    
    const hourOfDay: { [hour: number]: number } = {};
    const dayOfWeek: { [day: string]: number } = {};
    const monthOfYear: { [month: number]: number } = {};

    querySnapshot.forEach((docSnapshot: any) => {
      const data = docSnapshot.data();
      const timestamp = new Date(data.timestamp);
      
      // Hour of day analysis
      const hour = timestamp.getHours();
      hourOfDay[hour] = (hourOfDay[hour] || 0) + 1;
      
      // Day of week analysis
      const day = data.dayOfWeek;
      dayOfWeek[day] = (dayOfWeek[day] || 0) + 1;
      
      // Month of year analysis
      const month = timestamp.getMonth() + 1;
      monthOfYear[month] = (monthOfYear[month] || 0) + 1;
    });

    return { hourOfDay, dayOfWeek, monthOfYear };
  }

  private async getCount(field1: string, op1: string, value1: any, field2?: string, op2?: string, value2?: any): Promise<number> {
    try {
      const conesRef = this.db.collection('cones');
      let q: any;
      
      if (field2 && op2 && value2 !== undefined) {
        q = conesRef.where(field1, op1 as any, value1).where(field2, op2 as any, value2);
      } else {
        q = conesRef.where(field1, op1 as any, value1);
      }
      
      const querySnapshot = await q.get();
      return querySnapshot.size;
    } catch (error) {
      throw error;
    }
  }

  async exportData(userId: string): Promise<ExportData> {
    const cones = await this.getAllCones(userId);
    return {
      cones,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  async importData(userId: string, data: any): Promise<{ success: boolean; message: string; importedCount?: number }> {
    try {
      const batch = this.db.batch();
      const conesRef = this.db.collection('cones');
      
      let importedCount = 0;
      
      // Handle both old and new data formats
      const cones = data.cones || [];
      
      for (const cone of cones) {
        const docRef = conesRef.doc();
        
        // Clean and normalize the cone data
        const cleanCone = {
          timestamp: cone.timestamp,
          date: cone.date,
          time: cone.time,
          dayOfWeek: cone.dayOfWeek,
          notes: cone.notes || '',
          createdAt: cone.createdAt || cone.timestamp || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId
        };
        
        batch.set(docRef, cleanCone);
        importedCount++;
      }

      if (importedCount > 0) {
        await batch.commit();
      }

      return {
        success: true,
        message: `Successfully imported ${importedCount} cones`,
        importedCount
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async close(): Promise<void> {
    // Firestore doesn't require explicit connection closing
  }
}
