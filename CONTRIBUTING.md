# Contributing to Cone Counter

Thank you for your interest in contributing to Cone Counter! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (recommended)
- Git
- Firebase project setup

### Quick Start
1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd cone-counter
   ./scripts/dev-setup.sh
   ```

2. **Choose your development workflow:**
   
   **Option A: Local Development (Two Terminals)**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```
   
   **Option B: Docker Development (Single Command)**
   ```bash
   docker-compose up -d
   # Access at http://localhost:3000
   ```

## Project Architecture

### Backend (`src/`)
- **`server.ts`**: Express server with API endpoints and Firebase authentication
- **`database.ts`**: Firestore operations and schema management
- **`firebase-admin.ts`**: Firebase Admin SDK configuration
- **`types.ts`**: TypeScript interfaces and types

### Frontend (`frontend/src/`)
- **`App.tsx`**: Main application shell and routing
- **`components/`**: Reusable UI components
- **`api.ts`**: API client functions with authentication
- **`types.ts`**: Frontend type definitions

### Key Design Principles
- **Single Container**: Backend serves both API and static frontend
- **Timezone Consistency**: All dates displayed in local time, stored as UTC
- **Type Safety**: Full TypeScript coverage with explicit types
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Firebase Integration**: Cloud-based data storage with real-time sync

## Coding Standards

### TypeScript
- Prefer explicit types over `any`
- Use descriptive names (avoid 1-2 letter identifiers)
- Keep functions focused and single-purpose

### React
- Functional components only
- Use hooks for state and side effects
- Keep UI components pure
- Support dark mode via `dark:` Tailwind modifiers

### Backend
- Keep middleware minimal
- Use Firestore security rules for data protection
- Compute stats in database layer
- Keep route handlers thin
- Implement proper Firebase authentication

### Date Handling
- Store timestamps as ISO strings in UTC
- Derive `date`, `time`, and `dayOfWeek` from local time
- Use local dates for statistics calculations
- Week starts Monday (consistent with business logic)

## Development Workflow

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following coding standards
3. Test locally (see testing section below)
4. Commit with descriptive messages
5. Push and create a pull request

### Testing Your Changes
1. **Backend Testing:**
   ```bash
   # Start backend
   npm run dev
   
   # Test API endpoints (requires Firebase authentication)
   curl -H "Authorization: Bearer <firebase-id-token>" http://localhost:3000/api/stats
   ```

2. **Frontend Testing:**
   ```bash
   # Start frontend
   cd frontend && npm start
   
   # Test in browser at http://localhost:3001
   ```

3. **Full Stack Testing:**
   ```bash
   # Build and test Docker image
   docker build -t cone-counter:test .
   docker run -d -p 3000:3000 --env-file backend.env cone-counter:test
   ```

### Database Changes
- **Schema Changes**: Update `src/database.ts` and Firestore security rules
- **Data Migration**: Use the `normalizeDateFields()` method as a template
- **Testing**: Verify with sample data and edge cases
- **Security**: Update Firestore security rules for new collections/fields

## Docker Development

### Building
```bash
# Development build
docker build -t cone-counter:dev .

# Production build
docker build -t alexschladetsch/cone-counter:latest .
```

### Running
```bash
# Development with environment file
docker run -d -p 3000:3000 --env-file backend.env cone-counter:dev

# Production with environment file
docker run -d -p 3000:3000 --env-file backend.env alexschladetsch/cone-counter:latest
```

### Debugging
```bash
# View logs
docker logs <container-id>

# Interactive shell
docker exec -it <container-id> /bin/sh

# Firebase inspection
# Use Firebase Console for data inspection and management
```

## Database Schema

### Firestore Collections
```typescript
// Collection: 'users'
// Document ID: Firebase Auth UID
{
  email: string,
  displayName?: string,
  createdAt: string,     // ISO string
  updatedAt: string      // ISO string
}

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

### Firestore Indexes
- Composite index on `userId` + `timestamp` for sorting
- Composite index on `userId` + `date` for date filtering
- Composite index on `userId` + `dayOfWeek` for day analysis

## Testing Guidelines

### Manual Testing Checklist
- [ ] Add new cone with current time
- [ ] Add new cone with custom time
- [ ] Edit existing cone
- [ ] Delete cone
- [ ] View analytics across different time periods
- [ ] Export and import data
- [ ] Test dark mode toggle
- [ ] Verify responsive design on mobile
- [ ] Test Firebase authentication
- [ ] Verify user data isolation

### Edge Cases to Test
- **Timezone Changes**: Verify local time consistency
- **Date Boundaries**: Test near midnight entries
- **Large Datasets**: Performance with many entries
- **Invalid Input**: Handle malformed timestamps gracefully
- **Authentication**: Test with valid/invalid Firebase tokens
- **Data Import**: Test with various export file formats

## Common Issues

### Timezone Mismatches
- **Problem**: Dates showing wrong day
- **Solution**: Ensure `formatDateTime()` uses local time for derived fields
- **Prevention**: Test with entries near midnight

### Firebase Connection Issues
- **Problem**: Firestore connection errors
- **Solution**: Check Firebase project configuration and service account credentials
- **Prevention**: Verify Firebase Admin SDK initialization in `firebase-admin.ts`

### Authentication Errors
- **Problem**: API endpoints returning 401 errors
- **Solution**: Verify Firebase ID token format and validity
- **Prevention**: Test authentication flow end-to-end

### Build Failures
- **Problem**: Frontend build errors
- **Solution**: Clear `node_modules` and reinstall dependencies
- **Prevention**: Keep dependencies up to date

## Additional Resources

### API Documentation
- **Health Check**: `GET /api/stats`
- **Cones**: `GET/POST/PUT/DELETE /api/cones`
- **Analytics**: `GET /api/analysis`
- **Data**: `GET/POST /api/export` and `/api/import`
- **Authentication**: All endpoints require Firebase ID token

### Development Tools
- **TypeScript**: `tsc --noEmit` for type checking
- **ESLint**: Frontend linting with React rules
- **Tailwind**: Utility-first CSS framework
- **Recharts**: Chart library for analytics
- **Firebase Console**: Data inspection and management

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes following coding standards
4. **Test** thoroughly (see testing section)
5. **Commit** with clear, descriptive messages
6. **Push** to your fork
7. **Create** a pull request with:
   - Clear description of changes
   - Screenshots if UI changes
   - Testing notes
   - Any breaking changes
   - Firebase configuration changes if applicable

## Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Code Review**: All PRs require review before merging

## License

By contributing to Cone Counter, you agree that your contributions will be licensed under the MIT License.

---

**Happy coding!**

Thank you for contributing to Cone Counter!
