# 🚬 Cone Counter

A web application for tracking and analyzing bong/cone usage over time. Built with TypeScript, React, Node.js, and SQLite, all containerized in a single Docker image.

## ✨ Features

- **📊 Real-time Statistics**: Track total cones, daily/weekly/monthly counts, and averages
- **📈 Analytics & Trends**: Visualize usage patterns by hour, day of week, and month
- **✏️ Edit & Manage**: Modify existing entries with timestamps and notes
- **💾 Persistent Storage**: SQLite database with automatic data persistence
- **📤 Export/Import**: Backup and restore your data with JSON files
- **🎨 Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **🐳 Docker Ready**: Single container deployment with multi-arch support

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Or build and run manually:**
   ```bash
   # Build the image
   docker build -t alexschladetsch/cone-counter .
   
   # Run the container
   docker run -d -p 3000:3000 -v cone-data:/app/data alexschladetsch/cone-counter
   ```

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`

### Multi-Architecture Build

For ARM64 and AMD64 support:

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t alexschladetsch/cone-counter:latest --push .

# Or build locally
docker buildx build --platform linux/amd64,linux/arm64 -t alexschladetsch/cone-counter:latest .
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cone-counter
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start both the backend (port 3000) and frontend (port 3001) in development mode.

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
cone-counter/
├── src/                    # Backend TypeScript source
│   ├── database.ts        # Database operations
│   ├── server.ts          # Express server
│   └── types.ts           # TypeScript interfaces
├── frontend/              # React frontend
│   ├── src/               # React components
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Local development setup
└── package.json           # Backend dependencies
```

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: production)

### Database

The application uses SQLite for data storage, automatically created in the `/app/data` directory within the container. Data is persisted using Docker volumes.

## 📊 API Endpoints

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

## 🎯 Usage

### Adding a Cone
1. Click the "Add Cone" button in the header
2. Optionally set a custom timestamp (defaults to current time)
3. Add optional notes
4. Click "Add Cone"

### Editing a Cone
1. Click the edit icon (✏️) on any cone entry
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

## 🐳 Docker Commands

### Build and Run
```bash
# Build the image
docker build -t cone-counter .

# Run with port mapping and volume
docker run -d -p 3000:3000 -v cone-data:/app/data cone-counter

# Run in background
docker run -d --name cone-counter -p 3000:3000 -v cone-data:/app/data cone-counter
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

### Data Persistence
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect cone-data

# Backup volume data
docker run --rm -v cone-data:/data -v $(pwd):/backup alpine tar czf /backup/cone-data-backup.tar.gz -C /data .
```

## 🔒 Security Features

- **Helmet.js**: Security headers and protection
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Protection**: Parameterized queries
- **Non-root User**: Container runs as non-privileged user

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the Docker logs: `docker logs cone-counter`
2. Verify the container is running: `docker ps`
3. Check the health endpoint: `http://localhost:3000/api/stats`
4. Ensure port 3000 is available and not blocked by firewall

## 🚀 Deployment

### Production Deployment

The application is designed to run in production with minimal configuration:

```bash
# Pull the latest image
docker pull alexschladetsch/cone-counter:latest

# Run with production settings
docker run -d \
  --name cone-counter \
  -p 3000:3000 \
  -v cone-data:/app/data \
  --restart unless-stopped \
  alexschladetsch/cone-counter:latest
```

### Reverse Proxy

For production use, consider placing behind a reverse proxy (nginx, Traefik, etc.) with SSL termination.

---

**Happy tracking! 🚬📊**
