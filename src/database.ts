import sqlite3 from 'sqlite3';
import path from 'path';
import { Cone, ConeStats, TimeAnalysis, ExportData } from './types';

export class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'cones.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.serialize(() => {
      // Create cones table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS cones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          dayOfWeek TEXT NOT NULL,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // Create indexes for better performance
      this.db.run('CREATE INDEX IF NOT EXISTS idx_timestamp ON cones(timestamp)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_date ON cones(date)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_dayOfWeek ON cones(dayOfWeek)');
    });
  }

  async addCone(cone: Omit<Cone, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO cones (timestamp, date, time, dayOfWeek, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        cone.timestamp,
        cone.date,
        cone.time,
        cone.dayOfWeek,
        cone.notes || null,
        cone.createdAt,
        cone.updatedAt
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      
      stmt.finalize();
    });
  }

  async updateCone(id: number, updates: Partial<Cone>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = Object.values(updates).filter(value => value !== undefined);
      
      if (fields.length === 0) {
        resolve(false);
        return;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const sql = `UPDATE cones SET ${setClause}, updatedAt = ? WHERE id = ?`;
      
      const stmt = this.db.prepare(sql);
      stmt.run([...values, new Date().toISOString(), id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
      
      stmt.finalize();
    });
  }

  async deleteCone(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('DELETE FROM cones WHERE id = ?');
      stmt.run(id, function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
      stmt.finalize();
    });
  }

  async getCone(id: number): Promise<Cone | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM cones WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve((row as Cone) || null);
      });
    });
  }

  async getAllCones(): Promise<Cone[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM cones ORDER BY timestamp DESC', (err, rows) => {
        if (err) reject(err);
        else resolve((rows as Cone[]) || []);
      });
    });
  }

  async getConesByDateRange(startDate: string, endDate: string): Promise<Cone[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM cones WHERE date BETWEEN ? AND ? ORDER BY timestamp DESC',
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          else resolve((rows as Cone[]) || []);
        }
      );
    });
  }

  private async getMinDate(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT MIN(date) as minDate FROM cones', [], (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.minDate || null);
      });
    });
  }

  async getStats(): Promise<ConeStats> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get start of week (Monday)
    const startOfWeek = new Date(now);
    const weekday = (now.getDay() + 6) % 7; // Monday=0, Sunday=6
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - weekday);
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    // Get start of month
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [total, todayCount, weekCount, monthCount, minDateStr] = await Promise.all([
      this.getCount('SELECT COUNT(*) as count FROM cones'),
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE date = ?', [today]),
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE date >= ?', [weekStart]),
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE date >= ?', [monthStart]),
      this.getMinDate()
    ]);

    // Compute spans based on actual data range
    let daysSpan = 1;
    let weeksSpan = 1;
    let monthsSpan = 1;

    if (minDateStr) {
      const start = new Date(`${minDateStr}T00:00:00Z`);
      const end = new Date(`${today}T00:00:00Z`);
      const ms = end.getTime() - start.getTime();
      daysSpan = Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)) + 1);
      weeksSpan = Math.max(1, Math.ceil(daysSpan / 7));

      const startMonthIndex = start.getUTCFullYear() * 12 + start.getUTCMonth();
      const endMonthIndex = end.getUTCFullYear() * 12 + end.getUTCMonth();
      monthsSpan = Math.max(1, endMonthIndex - startMonthIndex + 1);
    }

    return {
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      averagePerDay: total / daysSpan,
      averagePerWeek: total / weeksSpan,
      averagePerMonth: total / monthsSpan
    };
  }

  async getTimeAnalysis(): Promise<TimeAnalysis> {
    const [hourData, dayData, monthData] = await Promise.all([
      this.getHourAnalysis(),
      this.getDayAnalysis(),
      this.getMonthAnalysis()
    ]);

    return {
      hourOfDay: hourData,
      dayOfWeek: dayData,
      monthOfYear: monthData
    };
  }

  private async getCount(sql: string, params: any[] = []): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  private async getHourAnalysis(): Promise<{ [hour: number]: number }> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT CAST(substr(time, 1, 2) AS INTEGER) as hour, COUNT(*) as count
        FROM cones 
        GROUP BY hour 
        ORDER BY hour
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const result: { [hour: number]: number } = {};
          rows.forEach(row => {
            result[row.hour] = row.count;
          });
          resolve(result);
        }
      });
    });
  }

  private async getDayAnalysis(): Promise<{ [day: string]: number }> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT dayOfWeek, COUNT(*) as count
        FROM cones 
        GROUP BY dayOfWeek 
        ORDER BY 
          CASE dayOfWeek 
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
          END
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const result: { [day: string]: number } = {};
          rows.forEach(row => {
            result[row.dayOfWeek] = row.count;
          });
          resolve(result);
        }
      });
    });
  }

  private async getMonthAnalysis(): Promise<{ [month: number]: number }> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT CAST(substr(date, 6, 2) AS INTEGER) as month, COUNT(*) as count
        FROM cones 
        GROUP BY month 
        ORDER BY month
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const result: { [month: number]: number } = {};
          rows.forEach(row => {
            result[row.month] = row.count;
          });
          resolve(result);
        }
      });
    });
  }

  async exportData(): Promise<ExportData> {
    const cones = await this.getAllCones();
    return {
      cones,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  async importData(data: ExportData): Promise<number> {
    // Clear existing data
    await this.clearAllData();
    
    // Import new data
    let importedCount = 0;
    for (const cone of data.cones) {
      const { id, ...coneData } = cone;
      await this.addCone(coneData);
      importedCount++;
    }
    
    return importedCount;
  }

  private async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cones', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close(): void {
    this.db.close();
  }
}
