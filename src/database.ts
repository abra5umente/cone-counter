import { Pool, PoolClient } from 'pg';
import { Cone, ConeStats, TimeAnalysis, ExportData } from './types';

export class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cone_counter',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          display_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create cones table with user support
      await client.query(`
        CREATE TABLE IF NOT EXISTS cones (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          timestamp TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          day_of_week TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Create indexes for better performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_cones_user_id ON cones(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_cones_timestamp ON cones(timestamp)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_cones_date ON cones(date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_cones_day_of_week ON cones(day_of_week)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_cones_user_date ON cones(user_id, date)');

      // Create function to update updated_at timestamp
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      // Create trigger for cones table
      await client.query(`
        DROP TRIGGER IF EXISTS update_cones_updated_at ON cones;
        CREATE TRIGGER update_cones_updated_at
          BEFORE UPDATE ON cones
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

    } finally {
      client.release();
    }
  }

  // User management methods
  async createUser(firebaseUid: string, email: string, displayName?: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email = $2, display_name = $3, updated_at = NOW()',
        [firebaseUid, email, displayName]
      );
    } finally {
      client.release();
    }
  }

  async getUser(firebaseUid: string): Promise<{ id: string; email: string; displayName?: string } | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, display_name FROM users WHERE id = $1',
        [firebaseUid]
      );
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        displayName: row.display_name
      };
    } finally {
      client.release();
    }
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

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, timestamp, date, time, day_of_week FROM cones WHERE user_id = $1',
        [userId]
      );

      let updated = 0;
      for (const row of result.rows) {
        const calc = computeFromTimestamp(row.timestamp);
        if (calc.date !== row.date || calc.time !== row.time || calc.dayOfWeek !== row.day_of_week) {
          await client.query(
            'UPDATE cones SET date = $1, time = $2, day_of_week = $3, updated_at = $4 WHERE id = $5',
            [calc.date, calc.time, calc.dayOfWeek, new Date().toISOString(), row.id]
          );
          updated++;
        }
      }
      return updated;
    } finally {
      client.release();
    }
  }

  async addCone(userId: string, cone: Omit<Cone, 'id'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO cones (user_id, timestamp, date, time, day_of_week, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          userId,
          cone.timestamp,
          cone.date,
          cone.time,
          cone.dayOfWeek,
          cone.notes || null,
          cone.createdAt,
          cone.updatedAt
        ]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async updateCone(userId: string, id: number, updates: Partial<Cone>): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = Object.values(updates).filter(value => value !== undefined);
      
      if (fields.length === 0) {
        return false;
      }

      // Convert field names to snake_case for PostgreSQL
      const snakeCaseFields = fields.map(field => {
        const mapping: { [key: string]: string } = {
          dayOfWeek: 'day_of_week',
          createdAt: 'created_at',
          updatedAt: 'updated_at'
        };
        return mapping[field] || field;
      });

      const setClause = snakeCaseFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const sql = `UPDATE cones SET ${setClause}, updated_at = $${values.length + 1} WHERE id = $${values.length + 2} AND user_id = $${values.length + 3}`;
      
          const result = await client.query(sql, [...values, new Date().toISOString(), id, userId]);
    return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async deleteCone(userId: string, id: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
          const result = await client.query(
      'DELETE FROM cones WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async getCone(userId: string, id: number): Promise<Cone | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM cones WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        timestamp: row.timestamp,
        date: row.date,
        time: row.time,
        dayOfWeek: row.day_of_week,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  async getAllCones(userId: string): Promise<Cone[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM cones WHERE user_id = $1 ORDER BY timestamp DESC',
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        date: row.date,
        time: row.time,
        dayOfWeek: row.day_of_week,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  async getConesByDateRange(userId: string, startDate: string, endDate: string): Promise<Cone[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM cones WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY timestamp DESC',
        [userId, startDate, endDate]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        date: row.date,
        time: row.time,
        dayOfWeek: row.day_of_week,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } finally {
      client.release();
    }
  }

  private async getMinDate(userId: string): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT MIN(date) as min_date FROM cones WHERE user_id = $1',
        [userId]
      );
      return result.rows[0]?.min_date || null;
    } finally {
      client.release();
    }
  }

  async getStats(userId: string): Promise<ConeStats> {
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
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE user_id = $1', [userId]),
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE user_id = $1 AND date = $2', [userId, today]),
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE user_id = $1 AND date >= $2', [userId, weekStart]),
      this.getCount('SELECT COUNT(*) as count FROM cones WHERE user_id = $1 AND date >= $2', [userId, monthStart]),
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
  }

  async getAnalysis(userId: string): Promise<TimeAnalysis> {
    const client = await this.pool.connect();
    try {
      // Get hour of day analysis
      const hourResult = await client.query(
        `SELECT 
           EXTRACT(HOUR FROM timestamp::timestamp) as hour,
           COUNT(*) as count
         FROM cones 
         WHERE user_id = $1 
         GROUP BY EXTRACT(HOUR FROM timestamp::timestamp)
         ORDER BY hour`,
        [userId]
      );

      // Get day of week analysis
      const dayResult = await client.query(
        `SELECT day_of_week, COUNT(*) as count
         FROM cones 
         WHERE user_id = $1 
         GROUP BY day_of_week
         ORDER BY 
           CASE day_of_week 
             WHEN 'Monday' THEN 1
             WHEN 'Tuesday' THEN 2
             WHEN 'Wednesday' THEN 3
             WHEN 'Thursday' THEN 4
             WHEN 'Friday' THEN 5
             WHEN 'Saturday' THEN 6
             WHEN 'Sunday' THEN 7
           END`,
        [userId]
      );

      // Get month of year analysis
      const monthResult = await client.query(
        `SELECT 
           EXTRACT(MONTH FROM timestamp::timestamp) as month,
           COUNT(*) as count
         FROM cones 
         WHERE user_id = $1 
         GROUP BY EXTRACT(MONTH FROM timestamp::timestamp)
         ORDER BY month`,
        [userId]
      );

      // Convert to expected format
      const hourOfDay: { [hour: number]: number } = {};
      hourResult.rows.forEach((row: any) => {
        hourOfDay[parseInt(row.hour)] = parseInt(row.count);
      });

      const dayOfWeek: { [day: string]: number } = {};
      dayResult.rows.forEach((row: any) => {
        dayOfWeek[row.day_of_week] = parseInt(row.count);
      });

      const monthOfYear: { [month: number]: number } = {};
      monthResult.rows.forEach((row: any) => {
        monthOfYear[parseInt(row.month)] = parseInt(row.count);
      });

      return { hourOfDay, dayOfWeek, monthOfYear };
    } finally {
      client.release();
    }
  }

  private async getCount(sql: string, params: any[] = []): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
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

  async importData(userId: string, data: ExportData): Promise<{ success: boolean; message: string; importedCount?: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let importedCount = 0;
      for (const cone of data.cones) {
        await client.query(
          `INSERT INTO cones (user_id, timestamp, date, time, day_of_week, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            cone.timestamp,
            cone.date,
            cone.time,
            cone.dayOfWeek,
            cone.notes || null,
            cone.createdAt,
            cone.updatedAt
          ]
        );
        importedCount++;
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: `Successfully imported ${importedCount} cones`,
        importedCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
