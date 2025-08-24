import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { Database } from './database';
import { Cone, ImportResult } from './types';
import { initializeFirebaseAdmin, verifyIdToken } from './firebase-admin';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

// Initialize database
const db = new Database();

// Enhanced CORS configuration for mobile devices
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Middleware (no security headers; allow wide-open CORS for simplicity)
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // Increase limit for mobile data import
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Mobile detection middleware
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|Windows Phone/i.test(userAgent);
  
  // Add mobile info to request for logging
  (req as any).isMobile = isMobile;
  
  next();
});

// Firebase Admin SDK setup (we'll need to install this)
// For now, we'll use a simple JWT verification middleware
// This is a placeholder - you'll need to implement proper Firebase Admin verification

interface AuthenticatedRequest extends express.Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
  };
  isMobile?: boolean;
}

// Firebase Admin authentication middleware
async function authenticateUser(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(token);
    
    // Get or create user in database
    let user = await db.getUser(decodedToken.uid);
    if (!user) {
      await db.createUser(decodedToken.uid, decodedToken.email, decodedToken.displayName);
      user = await db.getUser(decodedToken.uid);
    }
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.displayName
    };
    
    next();
  } catch (error) {
    // Enhanced error response for mobile debugging
    const errorResponse = {
      error: 'Invalid token',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      isMobile: req.isMobile
    };
    
    return res.status(401).json(errorResponse);
  }
}

// Utility function to format date and time (consistently using LOCAL time)
function formatDateTime(date: Date) {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const timestamp = date.toISOString();
  // Build local date string YYYY-MM-DD to avoid UTC shifting the day
  const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  // Keep local time component HH:MM:SS
  const timeStr = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[date.getDay()];
  
  return { timestamp, date: dateStr, time: timeStr, dayOfWeek };
}

// API Routes

// Health check endpoint (no authentication required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'MISSING'
  });
});

// Get all cones for authenticated user
app.get('/api/cones', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const cones = await db.getAllCones(req.user.uid);
    res.json(cones);
  } catch (error) {
    console.error('Error fetching cones:', error);
    res.status(500).json({ error: 'Failed to fetch cones', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get cone by ID for authenticated user
app.get('/api/cones/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const id = req.params.id;
    const cone = await db.getCone(req.user.uid, id);
    if (!cone) {
      return res.status(404).json({ error: 'Cone not found' });
    }
    res.json(cone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cone' });
  }
});

// Add new cone for authenticated user
app.post('/api/cones', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { timestamp, notes } = req.body;
    
    let date: Date;
    if (timestamp) {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    
    const { date: dateStr, time: timeStr, dayOfWeek } = formatDateTime(date);
    const now = new Date().toISOString();
    
    const coneData = {
      timestamp: date.toISOString(),
      date: dateStr,
      time: timeStr,
      dayOfWeek,
      notes: notes || '',
      createdAt: now,
      updatedAt: now
    };
    
    const id = await db.addCone(req.user.uid, coneData);
    const newCone = await db.getCone(req.user.uid, id);
    res.status(201).json(newCone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add cone' });
  }
});

// Update cone for authenticated user
app.put('/api/cones/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const id = req.params.id;
    const updates = req.body;
    
    // Validate cone exists and belongs to user
    const existingCone = await db.getCone(req.user.uid, id);
    if (!existingCone) {
      return res.status(404).json({ error: 'Cone not found' });
    }
    
    // Update timestamp-related fields if timestamp is provided
    if (updates.timestamp) {
      const date = new Date(updates.timestamp);
      const { date: dateStr, time: timeStr, dayOfWeek } = formatDateTime(date);
      updates.date = dateStr;
      updates.time = timeStr;
      updates.dayOfWeek = dayOfWeek;
    }
    
    updates.updatedAt = new Date().toISOString();
    
    const success = await db.updateCone(req.user.uid, id, updates);
    if (!success) {
      return res.status(400).json({ error: 'Failed to update cone' });
    }
    
    const updatedCone = await db.getCone(req.user.uid, id);
    res.json(updatedCone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cone' });
  }
});

// Delete cone for authenticated user
app.delete('/api/cones/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const id = req.params.id;
    const success = await db.deleteCone(req.user.uid, id);
    if (!success) {
      return res.status(404).json({ error: 'Cone not found' });
    }
    res.json({ message: 'Cone deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cone' });
  }
});

// Get statistics for authenticated user
app.get('/api/stats', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const startTime = Date.now();
    const stats = await db.getStats(req.user.uid);
    const duration = Date.now() - startTime;
    
    // Add mobile-specific debugging info
    const response = {
      ...stats,
      _debug: {
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        isMobile: req.isMobile,
        userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown'
      }
    };
    
    res.json(response);
  } catch (error) {
    // Enhanced error response for mobile debugging
    const errorResponse = {
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      isMobile: req.isMobile,
      userId: req.user?.uid
    };
    
    res.status(500).json(errorResponse);
  }
});

// Mobile-specific health check endpoint
app.get('/api/mobile-health', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad|Windows Phone/i.test(userAgent);
  
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    isMobile,
    userAgent: userAgent.substring(0, 200),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      port: PORT,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'missing'
    },
    features: {
      cors: true,
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      database: true
    }
  };
  
  res.json(healthInfo);
});

// Get time analysis for authenticated user
app.get('/api/analysis', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const analysis = await db.getAnalysis(req.user.uid);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Export data for authenticated user
app.get('/api/export', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const data = await db.exportData(req.user.uid);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cone-counter-export.json"');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Import data for authenticated user
app.post('/api/import', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const data = req.body;
    
    // Validate import data structure
    if (!data.cones || !Array.isArray(data.cones)) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }
    
    const result = await db.importData(req.user.uid, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to import data', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get cones by date range for authenticated user
app.get('/api/cones/range/:start/:end', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { start, end } = req.params;
    const cones = await db.getConesByDateRange(req.user.uid, start, end);
    res.json(cones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cones by date range' });
  }
});

// Get Firebase configuration for frontend
app.get('/api/firebase-config', (req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  
  // Check if all required config values are present
  const missingVars = Object.entries(config).filter(([key, value]) => !value);
  
  if (missingVars.length > 0) {
    return res.status(500).json({ 
      error: 'Firebase configuration incomplete',
      missing: missingVars.map(([key]) => key)
    });
  }
  
  res.json(config);
});

// Debug endpoint to test authentication without database operations
app.get('/api/auth-test', authenticateUser, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    res.json({ 
      success: true, 
      user: req.user,
      message: 'Authentication successful'
    });
  } catch (error) {
    res.status(500).json({ error: 'Auth test failed' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cone Counter server running on port ${PORT}`);
});
