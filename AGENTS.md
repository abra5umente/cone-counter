# Cone Counter - AI Agent Guide

This document is designed to help AI agents and developers understand the Cone Counter codebase, its architecture, and how to work with it effectively.

## 🎯 Project Overview

**Cone Counter** is a web application for tracking and analyzing bong/cone usage over time. It's built with TypeScript, React, Node.js, and SQLite, all containerized in a single Docker image.

### Key Features
- **📊 Real-time Statistics**: Track total cones, daily/weekly/monthly counts, and averages
- **📈 Analytics & Trends**: Visualize usage patterns by hour, day of week, and month
- **✏️ Edit & Manage**: Modify existing entries with timestamps and notes
- **💾 Persistent Storage**: SQLite database with automatic data persistence
- **🌍 Timezone Aware**: Consistent local time handling across all displays and statistics

## 🏗️ Architecture Patterns

### Single Container Design
The application uses a **single container architecture** where the Node.js backend serves both:
- API endpoints under `/api/*`
- Static frontend files from `frontend/build`

This design simplifies deployment and ensures consistency between frontend and backend.

### Database Schema
```sql
CREATE TABLE cones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,        -- ISO string in UTC
  date TEXT NOT NULL,             -- YYYY-MM-DD in local time
  time TEXT NOT NULL,             -- HH:MM:SS in local time
  dayOfWeek TEXT NOT NULL,        -- Day name in local time
  notes TEXT,                     -- Optional user notes
  createdAt TEXT NOT NULL,        -- ISO string
  updatedAt TEXT NOT NULL         -- ISO string
);
```

**Key Insight**: The app stores UTC timestamps but derives local time fields for display and analysis.

## 🌍 Timezone Handling (Critical Pattern)

### The Problem Solved
The original implementation had a timezone bug where dates near midnight could display as the previous day due to UTC vs local time conversion.

### The Solution Implemented
1. **Storage**: All timestamps stored as ISO strings in UTC
2. **Derived Fields**: `date`, `time`, and `dayOfWeek` computed from local time
3. **Display**: Frontend renders dates from the `timestamp` field to avoid drift
4. **Normalization**: Startup process corrects any existing data inconsistencies

### Key Code Locations
- **Backend Timezone Logic**: `src/server.ts` - `formatDateTime()` function
- **Database Normalization**: `src/database.ts` - `normalizeDateFields()` method
- **Frontend Display**: `frontend/src/components/ConeList.tsx` - renders from `timestamp`

### Example of the Fix
```typescript
// OLD (buggy): Used UTC for derived fields
const dateStr = date.toISOString().split('T')[0]; // Could be wrong day

// NEW (fixed): Uses local time for derived fields
const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
```

## 📁 Codebase Structure

### Backend (`src/`)
```
src/
├── database.ts        # Database operations, SQLite schema, normalization
├── server.ts          # Express server, API endpoints, timezone handling
└── types.ts           # TypeScript interfaces and types
```

### Frontend (`frontend/src/`)
```
frontend/src/
├── App.tsx            # Main application shell, tab navigation
├── components/        # Reusable UI components
│   ├── AddConeModal.tsx    # Add new cone form
│   ├── ConeList.tsx        # Display list of cones
│   ├── EditConeModal.tsx   # Edit existing cone
│   ├── Analytics.tsx       # Charts and trends
│   ├── DataManagement.tsx  # Import/export functionality
│   └── StatsCard.tsx       # Statistics display
├── api.ts             # API client functions
└── types.ts           # Frontend type definitions
```

## 🔑 Key Development Patterns

### 1. TypeScript First
- All functions have explicit return types
- Interfaces are defined for all data structures
- Avoid `any` except in narrow interop scenarios

### 2. React Patterns
- Functional components only
- Hooks for state management (`useState`, `useEffect`)
- Props interfaces for component contracts
- Dark mode support via Tailwind `dark:` modifiers

### 3. Database Patterns
- Parameterized queries to prevent SQL injection
- Prepared statements for all operations
- Automatic timestamp management (`createdAt`, `updatedAt`)
- Startup normalization for data consistency

### 4. API Patterns
- RESTful endpoints under `/api/*`
- Consistent error handling with descriptive messages
- JSON responses with proper HTTP status codes
- CORS enabled for development flexibility

## 🚨 Common Pitfalls & Solutions

### 1. Timezone Issues
**Problem**: Dates showing wrong day
**Solution**: Always use the `timestamp` field for display, derive local fields in backend
**Prevention**: Test with entries near midnight

### 2. Database Locking
**Problem**: SQLite database locked errors
**Solution**: Use prepared statements and proper error handling
**Prevention**: Check connection handling in `database.ts`

### 3. Build Failures
**Problem**: Frontend build errors
**Solution**: Clear `node_modules` and reinstall dependencies
**Prevention**: Keep dependencies up to date

### 4. Docker Issues
**Problem**: Container won't start or data not persisting
**Solution**: Check volume mounts and permissions
**Prevention**: Use `docker-compose up -d` for consistent setup

## 🧪 Testing Strategies

### Manual Testing Checklist
- [ ] Add new cone with current time
- [ ] Add new cone with custom time (especially near midnight)
- [ ] Edit existing cone
- [ ] Delete cone
- [ ] View analytics across different time periods
- [ ] Export and import data
- [ ] Test dark mode toggle
- [ ] Verify responsive design on mobile

### Automated Testing
```bash
# Backend testing
npm run dev  # Start backend
curl http://localhost:3000/api/stats  # Test health

# Frontend testing
cd frontend && npm start  # Start frontend
# Test in browser at http://localhost:3001

# Full stack testing
docker build -t cone-counter:test .
docker run -d -p 3000:3000 -v cone-data:/app/data cone-counter:test
```

## 🔧 Development Workflow

### Making Changes
1. **Understand the Pattern**: Study existing code for the pattern you're implementing
2. **Follow Timezone Rules**: If working with dates, ensure local time consistency
3. **Update Types**: Modify `types.ts` if adding new data structures
4. **Test Thoroughly**: Especially edge cases around time boundaries
5. **Document Changes**: Update relevant documentation files

### Code Review Checklist
- [ ] TypeScript types are explicit and correct
- [ ] Timezone handling follows established patterns
- [ ] Database operations use parameterized queries
- [ ] React components follow functional patterns
- [ ] Error handling is comprehensive
- [ ] Tests cover edge cases

## 📚 Key Files to Study

### For Backend Changes
1. **`src/server.ts`** - API endpoints and timezone logic
2. **`src/database.ts`** - Database operations and schema
3. **`src/types.ts`** - Backend type definitions

### For Frontend Changes
1. **`frontend/src/App.tsx`** - Main application structure
2. **`frontend/src/components/`** - UI component patterns
3. **`frontend/src/api.ts`** - API client implementation
4. **`frontend/src/types.ts`** - Frontend type definitions

### For Database Changes
1. **`src/database.ts`** - Schema and migration logic
2. **`src/server.ts`** - API endpoint implementations
3. **`src/types.ts`** - Data structure definitions

## 🌟 Best Practices

### 1. Timezone Handling
- Always store UTC timestamps
- Derive local time fields in backend
- Display dates from timestamp field in frontend
- Test with edge cases (midnight, DST changes)

### 2. Error Handling
- Use descriptive error messages
- Log errors appropriately
- Return proper HTTP status codes
- Handle edge cases gracefully

### 3. Performance
- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Optimize database queries

### 4. Security
- Use parameterized queries
- Validate all input data
- Implement proper CORS policies
- Consider rate limiting for production

## 🚀 Deployment Considerations

### Docker Commands
```bash
# Build and run
docker build -t alexschladetsch/cone-counter:latest .
docker-compose up -d

# Health check
curl http://localhost:3000/api/stats

# View logs
docker logs cone-counter
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: production)

### Data Persistence
- SQLite database stored in `/app/data/cones.db`
- Use Docker volumes for data persistence
- Backup strategy: export via `/api/export` endpoint

## 🤝 Contributing Guidelines

### Code Style
- Use descriptive variable names
- Keep functions focused and single-purpose
- Add comments for complex logic
- Follow existing patterns in the codebase

### Testing Requirements
- Test timezone edge cases
- Verify database operations
- Check responsive design
- Test dark mode functionality

### Documentation
- Update relevant documentation files
- Add inline comments for complex logic
- Document any new API endpoints
- Update deployment guides if needed

## 📞 Getting Help

### When You're Stuck
1. **Check the Documentation**: README.md, API.md, DEPLOYMENT.md
2. **Study Existing Code**: Look for similar patterns
3. **Test Incrementally**: Make small changes and test
4. **Check Logs**: Use `docker logs cone-counter` for backend issues

### Common Questions
- **Q**: Why are dates showing the wrong day?
- **A**: Check timezone handling in `formatDateTime()` function

- **Q**: How do I add a new API endpoint?
- **A**: Follow the pattern in `src/server.ts`, update types, test thoroughly

- **Q**: How do I modify the database schema?
- **A**: Update `src/database.ts`, add migration logic, test with sample data

---

**Remember**: The timezone handling is critical to the application's functionality. Always test date-related changes thoroughly, especially around midnight boundaries.

**Happy coding! 🚬📊**
