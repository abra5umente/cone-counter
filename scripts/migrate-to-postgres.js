#!/usr/bin/env node

/**
 * Migration script to move data from SQLite to PostgreSQL
 * 
 * Usage:
 * 1. Make sure PostgreSQL is running and accessible
 * 2. Update the database connection details below
 * 3. Run: node scripts/migrate-to-postgres.js
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// SQLite database path (relative to project root)
const sqlitePath = path.join(__dirname, '..', 'data', 'cones.db');

// PostgreSQL connection details
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cone_counter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Initialize connections
const sqliteDb = new sqlite3.Database(sqlitePath);
const pgPool = new Pool(pgConfig);

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Test PostgreSQL connection
    const client = await pgPool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Check if users table exists and create a default user
    const defaultUserId = 'migrated-user-' + Date.now();
    await client.query(
      'INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [defaultUserId, 'migrated@example.com', 'Migrated User']
    );
    console.log('✅ Created default user for migration');
    
    // Get all cones from SQLite
    const cones = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM cones ORDER BY timestamp', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📊 Found ${cones.length} cones to migrate`);
    
    if (cones.length === 0) {
      console.log('ℹ️  No data to migrate');
      return;
    }
    
    // Begin transaction
    await client.query('BEGIN');
    
    let migratedCount = 0;
    for (const cone of cones) {
      try {
        // Convert SQLite field names to PostgreSQL format
        await client.query(
          `INSERT INTO cones (user_id, timestamp, date, time, day_of_week, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            defaultUserId,
            cone.timestamp,
            cone.date,
            cone.time,
            cone.dayOfWeek,
            cone.notes || null,
            cone.createdAt,
            cone.updatedAt
          ]
        );
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`📈 Migrated ${migratedCount}/${cones.length} cones...`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate cone ${cone.id}:`, error);
        throw error;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log(`✅ Successfully migrated ${migratedCount} cones`);
    
    // Verify migration
    const result = await client.query('SELECT COUNT(*) as count FROM cones WHERE user_id = $1', [defaultUserId]);
    const pgCount = parseInt(result.rows[0].count);
    console.log(`🔍 Verification: PostgreSQL now has ${pgCount} cones`);
    
    if (pgCount === cones.length) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.warn('⚠️  Migration count mismatch - please verify data integrity');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    sqliteDb.close();
    await pgPool.end();
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  sqliteDb.close();
  await pgPool.end();
  process.exit(0);
});

// Run migration
migrateData().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
