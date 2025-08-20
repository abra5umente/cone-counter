import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { Database } from './database';
import { Cone, ImportResult } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();
// On startup, normalize any existing rows that may have UTC-shifted dates
(async () => {
	try {
		const updated = await db.normalizeDateFields();
		if (updated > 0) {
			console.log(`Normalized date fields for ${updated} existing cone(s)`);
		}
	} catch (e) {
		console.warn('Date normalization skipped due to error:', e);
	}
})();

// Middleware (no security headers; allow wide-open CORS for simplicity)
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

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

// Get all cones
app.get('/api/cones', async (req, res) => {
	try {
		const cones = await db.getAllCones();
		res.json(cones);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch cones' });
	}
});

// Get cone by ID
app.get('/api/cones/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const cone = await db.getCone(id);
		if (!cone) {
			return res.status(404).json({ error: 'Cone not found' });
		}
		res.json(cone);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch cone' });
	}
});

// Add new cone
app.post('/api/cones', async (req, res) => {
	try {
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
		
		const id = await db.addCone(coneData);
		const newCone = await db.getCone(id);
		res.status(201).json(newCone);
	} catch (error) {
		res.status(500).json({ error: 'Failed to add cone' });
	}
});

// Update cone
app.put('/api/cones/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const updates = req.body;
		
		// Validate cone exists
		const existingCone = await db.getCone(id);
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
		
		const success = await db.updateCone(id, updates);
		if (!success) {
			return res.status(400).json({ error: 'Failed to update cone' });
		}
		
		const updatedCone = await db.getCone(id);
		res.json(updatedCone);
	} catch (error) {
		res.status(500).json({ error: 'Failed to update cone' });
	}
});

// Delete cone
app.delete('/api/cones/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const success = await db.deleteCone(id);
		if (!success) {
			return res.status(404).json({ error: 'Cone not found' });
		}
		res.json({ message: 'Cone deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete cone' });
	}
});

// Get statistics
app.get('/api/stats', async (req, res) => {
	try {
		const stats = await db.getStats();
		res.json(stats);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch statistics' });
	}
});

// Get time analysis
app.get('/api/analysis', async (req, res) => {
	try {
		const analysis = await db.getTimeAnalysis();
		res.json(analysis);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch analysis' });
	}
});

// Export data
app.get('/api/export', async (req, res) => {
	try {
		const data = await db.exportData();
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', 'attachment; filename="cone-counter-export.json"');
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: 'Failed to export data' });
	}
});

// Import data
app.post('/api/import', async (req, res) => {
	try {
		const data = req.body;
		
		// Validate import data structure
		if (!data.cones || !Array.isArray(data.cones)) {
			return res.status(400).json({ error: 'Invalid import data format' });
		}
		
		const result = await db.importData(data);
		res.json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to import data' });
	}
});

// Get cones by date range
app.get('/api/cones/range/:start/:end', async (req, res) => {
	try {
		const { start, end } = req.params;
		const cones = await db.getConesByDateRange(start, end);
		res.json(cones);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch cones by date range' });
	}
});

// Serve React app for all other routes
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('Shutting down gracefully...');
	db.close();
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('Shutting down gracefully...');
	db.close();
	process.exit(0);
});

// Start server
app.listen(PORT, () => {
	console.log(`🚬 Cone Counter server running on port ${PORT}`);
	console.log(`📊 Database initialized at: ${path.join(process.cwd(), 'data', 'cones.db')}`);
});
