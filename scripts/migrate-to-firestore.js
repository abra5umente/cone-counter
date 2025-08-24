#!/usr/bin/env node

/**
 * Migration script to move data from PostgreSQL to Firebase Firestore
 * 
 * Usage:
 * 1. Set up your Firebase Admin SDK credentials in environment variables
 * 2. Run: node scripts/migrate-to-firestore.js
 * 
 * This script will:
 * - Connect to your existing PostgreSQL database
 * - Export all data
 * - Import it into Firestore
 * - Preserve user relationships and timestamps
 */

import { Pool } from 'pg';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
}

// Initialize PostgreSQL connection
function initializePostgreSQL() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cone_counter',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  return pool;
}

// Export data from PostgreSQL
async function exportFromPostgreSQL(pool) {
  console.log('Exporting data from PostgreSQL...');
  
  try {
    // Get all users
    const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at');
    const users = usersResult.rows;
    console.log(`Found ${users.length} users`);
    
    // Get all cones
    const conesResult = await pool.query('SELECT * FROM cones ORDER BY created_at');
    const cones = conesResult.rows;
    console.log(`Found ${cones.length} cones`);
    
    return { users, cones };
  } catch (error) {
    console.error('Error exporting from PostgreSQL:', error);
    throw error;
  }
}

// Import data to Firestore
async function importToFirestore(users, cones) {
  console.log('🔥 Importing data to Firestore...');
  
  const db = getFirestore();
  const batch = writeBatch(db);
  
  try {
    // Import users
    console.log('Importing users...');
    for (const user of users) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, {
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
    }
    
    // Import cones
    console.log('Importing cones...');
    for (const cone of cones) {
      const coneRef = doc(db, 'cones');
      batch.set(coneRef, {
        userId: cone.user_id,
        timestamp: cone.timestamp,
        date: cone.date,
        time: cone.time,
        dayOfWeek: cone.day_of_week,
        notes: cone.notes,
        createdAt: cone.created_at,
        updatedAt: cone.updated_at
      });
    }
    
    // Commit the batch
    await batch.commit();
    console.log('Data imported successfully to Firestore');
    
  } catch (error) {
    console.error('Error importing to Firestore:', error);
    throw error;
  }
}

// Main migration function
async function migrateToFirestore() {
  console.log('Starting migration from PostgreSQL to Firestore...');
  
  let postgresPool;
  
  try {
    // Initialize Firebase Admin SDK
    initializeFirebaseAdmin();
    
    // Initialize PostgreSQL connection
    postgresPool = initializePostgreSQL();
    
    // Test PostgreSQL connection
    await postgresPool.query('SELECT NOW()');
    console.log('PostgreSQL connection successful');
    
    // Export data from PostgreSQL
    const { users, cones } = await exportFromPostgreSQL(postgresPool);
    
    // Import data to Firestore
    await importToFirestore(users, cones);
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${users.length} users and ${cones.length} cones`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (postgresPool) {
      await postgresPool.end();
      console.log('🔌 PostgreSQL connection closed');
    }
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToFirestore();
}

export { migrateToFirestore };
