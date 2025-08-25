# Cone Counter
<img width="1354" height="889" alt="Untitled" src="https://github.com/user-attachments/assets/96fcf45d-46bc-44fc-97e4-2a432657e75d" />  


A webapp built specfically and only to track how many bongs you smoke.

Built with TypeScript, React, Node.js, and Firebase Firestore, all containerized in a single Docker image.

## Screenshots  
Main screen:  
<img width="1354" height="889" alt="Untitled" src="https://github.com/user-attachments/assets/96fcf45d-46bc-44fc-97e4-2a432657e75d" />  
Adding a new cone:  
<img width="1356" height="889" alt="Untitled" src="https://github.com/user-attachments/assets/abedaf7a-d48b-4601-b179-c8f5e7c8c802" />  
Data analytics dashboard (because numbers):  
<img width="1371" height="1260" alt="Untitled" src="https://github.com/user-attachments/assets/9b81cd48-44a5-4a73-b27a-f347a08c33c3" />  
Exporting data:  
<img width="1372" height="896" alt="Untitled" src="https://github.com/user-attachments/assets/bb45109f-b0c6-4ead-b80e-554f56213cbf" />  


## Features

- **Real-time Statistics**: Track total cones, daily/weekly/monthly counts, and averages
- **Analytics & Trends**: Visualize usage patterns by hour, day of week, and month
- **Edit & Manage**: Modify existing entries with timestamps and notes
- **Cloud Storage**: Firebase Firestore database with automatic scaling and real-time sync
- **User Authentication**: Secure Google Sign-in with Firebase Auth
- **Export/Import**: Backup and restore your data with JSON files
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS with dark mode support
- **Docker Ready**: Single container deployment with multi-arch support
- **Timezone Aware**: Consistent local time handling across all displays and statistics

## Usage

### Adding a Cone
1. Click the "Add Cone" button in the header
2. Optionally set a custom timestamp (defaults to current local time)
3. Add optional notes
4. Click "Add Cone"

### Editing a Cone
1. Click the edit icon on any cone entry
2. Modify the timestamp and/or notes
3. Click "Save Changes"

### Viewing Analytics
1. Navigate to the "Analytics" tab
2. View charts showing:
   - Hour of day patterns
   - Day of week trends
   - Monthly usage distribution

### Data Management
1. Go to the "Data Management" tab
2. **Export**: Download your data as a JSON file
3. **Import**: Upload a previously exported file (replaces all data)

## Quick Start

### Prerequisites

Before running the application, you need to set up Firebase:

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Firestore Database** and **Authentication**
3. **Generate a service account key** for the backend
4. **Set up environment variables** (see `backend.env.example`)

### Using Docker (Recommended)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Or build and run manually:**
   ```bash
   # Build the image
   docker build -t alexschladetsch/cone-counter:latest .
   
   # Run the container
   docker run -d -p 3000:3000 alexschladetsch/cone-counter:latest
   ```

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`
   - Health check: `http://localhost:3000/api/stats`

### Multi-Architecture Build

For ARM64 and AMD64 support:

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t alexschladetsch/cone-counter:latest --push .

# Or build locally
docker buildx build --platform linux/amd64,linux/arm64 -t alexschladetsch/cone-counter:latest .
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cone-counter
   ```

2. **Install dependencies:**
   ```bash
   # Backend dependencies
   npm install
   
   # Frontend dependencies
   cd frontend && npm install
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```

4. **Build for production:**
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Build Docker image
   docker build -t alexschladetsch/cone-counter:latest .
   ```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: production)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_CLIENT_ID`: Service account client ID
- `FIREBASE_PRIVATE_KEY_ID`: Service account private key ID
- `FIREBASE_CLIENT_CERT_URL`: Service account certificate URL

### Database

The application uses Firebase Firestore for data storage, providing automatic scaling and real-time synchronization.

**Database Schema:**
- `cones` collection with fields: `id`, `timestamp` (ISO), `date` (YYYY-MM-DD), `time` (HH:MM:SS), `dayOfWeek`, `notes`, `createdAt`, `updatedAt`, `userId`
- `users` collection for user management
- Automatic indexing on `timestamp`, `date`, and `dayOfWeek` for performance
- Startup normalization ensures all derived date fields match local time

## API Endpoints

### Cones
- `GET /api/cones` - Get all cones
- `GET /api/cones/:id` - Get cone by ID
- `POST /api/cones` - Add new cone
- `PUT /api/cones/:id` - Update cone
- `DELETE /api/cones/:id` - Delete cone

### Analytics
- `GET /api/stats` - Get usage statistics
- `GET /api/analysis` - Get time-based analysis
- `GET /api/cones/range/:start/:end` - Get cones by date range

### Data Management
- `GET /api/export` - Export all data
- `POST /api/import` - Import data (replaces existing)

## Docker Commands

### Build and Run
```bash
# Build the image
docker build -t alexschladetsch/cone-counter:latest .

# Run with port mapping
docker run -d -p 3000:3000 alexschladetsch/cone-counter:latest

# Run in background
docker run -d --name cone-counter -p 3000:3000 alexschladetsch/cone-counter:latest
```

### Management
```bash
# View logs
docker logs cone-counter

# Stop the container
docker stop cone-counter

# Remove the container
docker rm cone-counter

# View running containers
docker ps
```

## Security Features

- **CORS**: Permissive cross-origin requests for development flexibility
- **Input Validation**: Server-side validation of all inputs
- **Firebase Security**: Firestore security rules for data protection
- **Non-root User**: Container runs as non-privileged user

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues:

1. Check the Docker logs: `docker logs cone-counter`
2. Verify the container is running: `docker ps`
3. Check the health endpoint: `http://localhost:3000/api/stats`
4. Ensure port 3000 is available and not blocked by firewall

## Deployment

### Production Deployment

The application is designed to run in production with minimal configuration:

```bash
# Pull the latest image
docker pull alexschladetsch/cone-counter:latest

# Run with production settings
docker run -d \
  --name cone-counter \
  -p 3000:3000 \
  --restart unless-stopped \
  alexschladetsch/cone-counter:latest
```

### Reverse Proxy

For production use, consider placing behind a reverse proxy (nginx, Traefik, etc.) with SSL termination.

---

**Happy tracking!**
