# Cone Counter - AI Agent Guide

This document is designed to help AI agents and developers understand the Cone Counter codebase, its architecture, and how to work with it effectively.

## Project Overview

**Cone Counter** is a web application for tracking and analyzing bong/cone usage over time. It's built with TypeScript, React, Node.js, and Firebase Firestore, all containerized in a single Docker image.

### Key Features
- **Real-time Statistics**: Track total cones, daily/weekly/monthly counts, and averages
- **Analytics & Trends**: Visualize usage patterns by hour, day of week, and month
- **Edit & Manage**: Modify existing entries with timestamps and notes
- **Cloud Storage**: Firebase Firestore database with automatic scaling and real-time sync
- **User Authentication**: Secure Google Sign-in with Firebase Auth
- **Timezone Aware**: Consistent local time handling across all displays and statistics
- **Mobile Optimized**: Enhanced CORS and mobile device detection
- **Cloud Run Ready**: Optimized for Google Cloud Run deployment

## Architecture Patterns

### Single Container Design
The application uses a **single container architecture** where the Node.js backend serves both:
- API endpoints under `/api/*`
- Static frontend files from `frontend/dist` (Vite build output)

This design simplifies deployment and ensures consistency between frontend and backend.

### Database Schema (Firestore Collections)

#### Users Collection
```typescript
// Collection: 'users'
// Document ID: Firebase Auth UID
{
  email: string,
  displayName?: string,
  createdAt: string,     // ISO string
  updatedAt: string      // ISO string
}
```

#### Cones Collection
```typescript
// Collection: 'cones'
// Document ID: Auto-generated Firestore ID
{
  userId: string,        // References user document ID
  timestamp: string,     // ISO string in UTC
  date: string,          // YYYY-MM-DD in local time
  time: string,          // HH:MM:SS in local time
  dayOfWeek: string,     // Day name in local time
  notes?: string,        // Optional user notes
  createdAt: string,     // ISO string
  updatedAt: string      // ISO string
}
```

**Key Insight**: The app stores UTC timestamps but derives local time fields for display and analysis. Each cone document is linked to a user via the `userId` field.

## Timezone Handling (Critical Pattern)

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

## Codebase Structure

### Backend (`src/`)
```
src/
├── database.ts        # Database operations, Firestore schema, normalization
├── server.ts          # Express server, API endpoints, timezone handling
├── firebase-admin.ts  # Firebase Admin SDK configuration
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
│   ├── Login.tsx           # Authentication component
│   ├── ProtectedRoute.tsx  # Route protection
│   ├── StatsCard.tsx       # Statistics display
│   └── MobileDebug.tsx     # Mobile device debugging
├── contexts/
│   └── AuthContext.tsx     # Firebase authentication context
├── api.ts             # API client functions
├── firebase.ts        # Firebase client configuration
├── types.ts           # Frontend type definitions
└── index.tsx          # Application entry point
```

### Build System
- **Frontend**: Vite with React and TypeScript
- **Backend**: TypeScript compilation with ts-node for development
- **Output**: Frontend builds to `frontend/dist`, backend to `dist/`

## Key Development Patterns

### 1. TypeScript First
- All functions have explicit return types
- Interfaces are defined for all data structures
- Avoid `any` except in narrow interop scenarios

### 2. React Patterns
- Functional components only
- Hooks for state management (`useState`, `useEffect`)
- Props interfaces for component contracts
- Dark mode support via Tailwind `dark:` modifiers
- Context API for authentication state

### 3. Database Patterns
- Firestore security rules for data protection
- Document-based operations with collections
- Automatic timestamp management (`createdAt`, `updatedAt`)
- Batch operations for consistency
- User-scoped data access (all cones filtered by `userId`)

### 4. API Patterns
- RESTful endpoints under `/api/*`
- Consistent error handling with descriptive messages
- JSON responses with proper HTTP status codes
- Enhanced CORS for mobile device compatibility
- Mobile detection middleware for debugging

## Common Pitfalls & Solutions

### 1. Timezone Issues
**Problem**: Dates showing wrong day
**Solution**: Always use the `timestamp` field for display, derive local fields in backend
**Prevention**: Test with entries near midnight

### 2. Firestore Connection Issues
**Problem**: Firestore connection errors (Error: 5 NOT_FOUND)
**Solution**: Verify Firebase project configuration and service account credentials
**Prevention**: Check Firebase Admin SDK initialization in `firebase-admin.ts`

### 3. Build Failures
**Problem**: Frontend build errors with Vite
**Solution**: Clear `node_modules` and reinstall dependencies, check Vite configuration
**Prevention**: Keep dependencies up to date, verify Vite config compatibility

### 4. Docker Issues
**Problem**: Container won't start or Firebase credentials not loading
**Solution**: Check environment variables and Firebase configuration
**Prevention**: Ensure `.env` file is properly formatted and Firebase project is set up

### 5. Port Configuration
**Problem**: Application not accessible on expected port
**Solution**: Default port is now 8080 for Cloud Run compatibility
**Prevention**: Check `PORT` environment variable and Docker port mappings

## Testing Strategies

### Manual Testing Checklist
- [ ] Add new cone with current time
- [ ] Add new cone with custom time (especially near midnight)
- [ ] Edit existing cone
- [ ] Delete cone
- [ ] View analytics across different time periods
- [ ] Export and import data
- [ ] Test dark mode toggle
- [ ] Verify responsive design on mobile
- [ ] Test authentication flow
- [ ] Verify mobile device detection

### Automated Testing
```bash
# Backend testing
npm run dev:backend  # Start backend only
curl http://localhost:8080/api/stats  # Test health

# Frontend testing
cd frontend && npm run dev  # Start Vite dev server
# Test in browser at http://localhost:5173

# Full stack testing
docker build -t cone-counter:test .
docker run -d -p 8080:8080 cone-counter:test
```

## Development Workflow

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
- [ ] Mobile compatibility considered

## Key Files to Study

### For Backend Changes
1. **`src/server.ts`** - API endpoints and timezone logic
2. **`src/database.ts`** - Database operations and schema
3. **`src/types.ts`** - Backend type definitions
4. **`src/firebase-admin.ts`** - Firebase Admin SDK setup

### For Frontend Changes
1. **`frontend/src/App.tsx`** - Main application structure
2. **`frontend/src/components/`** - UI component patterns
3. **`frontend/src/api.ts`** - API client implementation
4. **`frontend/src/contexts/AuthContext.tsx`** - Authentication logic
5. **`frontend/src/firebase.ts`** - Firebase client configuration
6. **`frontend/src/types.ts`** - Frontend type definitions
7. **`frontend/vite.config.ts`** - Vite configuration

### For Database Changes
1. **`src/database.ts`** - Firestore operations and data normalization
2. **`src/firebase-admin.ts`** - Firebase Admin SDK configuration
3. **`src/server.ts`** - API endpoint implementations
4. **`src/types.ts`** - Data structure definitions

## Best Practices

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
- Provide mobile-friendly error responses

### 3. Performance
- Use Firestore composite indexes for complex queries
- Implement pagination for large datasets (Firestore has 10k document limit per query)
- Cache frequently accessed data
- Optimize Firestore queries and minimize read operations

### 4. Security
- Configure Firestore security rules properly
- Validate all input data
- Implement proper CORS policies
- Use Firebase Auth for user authentication
- Never commit service account keys to version control

### 5. Mobile Optimization
- Test responsive design on various screen sizes
- Ensure touch-friendly interface elements
- Optimize for mobile data usage
- Provide mobile-specific error messages

## Deployment Considerations

### Docker Commands
```bash
# Build and run
docker build -t alexschladetsch/cone-counter:latest .
docker-compose up -d

# Health check (note: port 8080)
curl http://localhost:8080/api/stats

# View logs
docker logs cone-counter-app
```

### Environment Variables
- `PORT`: Server port (default: 8080 for Cloud Run)
- `NODE_ENV`: Environment mode (default: production)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key
- `FIREBASE_CLIENT_EMAIL`: Service account email
- (See `backend.env.example` for complete list)

### Data Persistence
- Firebase Firestore cloud database (no local storage needed)
- Automatic scaling and real-time synchronization
- Backup strategy: export via `/api/export` endpoint
- Data is automatically replicated across Firebase infrastructure

### Cloud Run Deployment
- Optimized for Google Cloud Run
- Health check endpoint: `/api/stats`
- Port 8080 for Cloud Run compatibility
- Multi-stage Docker build for efficiency

## Contributing Guidelines

### Code Style
- Use descriptive variable names
- Keep functions focused and single-purpose
- Add comments for complex logic
- Follow existing patterns in the codebase
- Consider mobile device compatibility

### Testing Requirements
- Test timezone edge cases
- Verify database operations
- Check responsive design
- Test dark mode functionality
- Verify mobile device detection
- Test authentication flows

### Documentation
- Update relevant documentation files
- Add inline comments for complex logic
- Document any new API endpoints
- Update deployment guides if needed

## Getting Help

### When You're Stuck
1. **Check the Documentation**: README.md, API.md, DEPLOYMENT.md, FIREBASE_SETUP.md
2. **Study Existing Code**: Look for similar patterns
3. **Test Incrementally**: Make small changes and test
4. **Check Logs**: Use `docker logs cone-counter-app` for backend issues

### Common Questions
- **Q**: Why are dates showing the wrong day?
- **A**: Check timezone handling in `formatDateTime()` function

- **Q**: How do I add a new API endpoint?
- **A**: Follow the pattern in `src/server.ts`, update types, test thoroughly

- **Q**: How do I modify the database schema?
- **A**: Update Firestore collections in `src/database.ts`, update TypeScript interfaces, test with sample data

- **Q**: How do I set up Firebase for development?
- **A**: Create Firebase project, enable Firestore and Auth, generate service account key, configure environment variables

- **Q**: Why is the app running on port 8080 instead of 3000?
- **A**: Port 8080 is the default for Google Cloud Run compatibility

- **Q**: How do I test mobile device detection?
- **A**: Use browser dev tools to simulate mobile devices or test on actual mobile devices

- **Q**: What's the difference between `frontend/build` and `frontend/dist`?
- **A**: The project now uses Vite which outputs to `dist/` instead of Create React App's `build/` directory

---

**Remember**: The timezone handling is critical to the application's functionality. Always test date-related changes thoroughly, especially around midnight boundaries.

**Happy coding!**
