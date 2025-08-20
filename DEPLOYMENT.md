# Cone Counter Deployment Guide

This guide covers deploying Cone Counter in various environments, from local development to production.

## 🚀 Quick Deployment

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd cone-counter

# Start the application
docker-compose up -d

# Access at http://localhost:3000
```

### Using Docker Run

```bash
# Build the image
docker build -t alexschladetsch/cone-counter:latest .

# Run the container
docker run -d \
  --name cone-counter \
  -p 3000:3000 \
  -v cone-data:/app/data \
  --restart unless-stopped \
  alexschladetsch/cone-counter:latest
```

## 🐳 Docker Configuration

### Dockerfile Overview

The application uses a multi-stage Docker build:

1. **Frontend Builder**: Compiles React app to static files
2. **Backend Builder**: Compiles TypeScript backend
3. **Production Runner**: Minimal runtime image with built assets

### Build Arguments

```dockerfile
# Build for specific architecture
docker build --platform linux/amd64 -t cone-counter:amd64 .

# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t cone-counter:multi .
```

### Environment Variables

```bash
# Server configuration
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production         # Environment mode (default: production)

# Database configuration (auto-configured)
# SQLite database stored in /app/data/cones.db
```

## 🏗️ Production Deployment

### Single Server Deployment

```bash
# 1. Build production image
docker build -t alexschladetsch/cone-counter:latest .

# 2. Create persistent volume
docker volume create cone-data

# 3. Run with production settings
docker run -d \
  --name cone-counter \
  -p 3000:3000 \
  -v cone-data:/app/data \
  --restart unless-stopped \
  --health-cmd="curl -f http://localhost:3000/api/stats || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  alexschladetsch/cone-counter:latest
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  cone-counter:
    image: alexschladetsch/cone-counter:latest
    ports:
      - "3000:3000"
    volumes:
      - cone-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/stats"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  cone-data:
    driver: local
```

### Multi-Architecture Deployment

```bash
# Build for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t alexschladetsch/cone-counter:latest \
  --push .

# Pull and run on target architecture
docker pull alexschladetsch/cone-counter:latest
docker run -d -p 3000:3000 -v cone-data:/app/data alexschladetsch/cone-counter:latest
```

## 🌐 Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Cone Counter
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Traefik Configuration

```yaml
version: '3.8'

services:
  cone-counter:
    image: alexschladetsch/cone-counter:latest
    volumes:
      - cone-data:/app/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.cone-counter.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.cone-counter.tls=true"
      - "traefik.http.routers.cone-counter.tls.certresolver=letsencrypt"
      - "traefik.http.services.cone-counter.loadbalancer.server.port=3000"
    restart: unless-stopped

volumes:
  cone-data:
    driver: local
```

## 📊 Monitoring and Health Checks

### Health Check Endpoint

```bash
# Check application health
curl http://localhost:3000/api/stats

# Expected response: 200 OK with statistics JSON
```

### Docker Health Checks

```bash
# View container health status
docker ps

# Check health check logs
docker inspect cone-counter | grep -A 10 Health

# Manual health check
docker exec cone-counter curl -f http://localhost:3000/api/stats
```

### Logging

```bash
# View application logs
docker logs cone-counter

# Follow logs in real-time
docker logs -f cone-counter

# View logs with timestamps
docker logs -t cone-counter
```

## 💾 Data Management

### Backup Strategy

```bash
# 1. Stop the application
docker stop cone-counter

# 2. Backup the data volume
docker run --rm -v cone-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/cone-counter-backup-$(date +%Y%m%d).tar.gz -C /data .

# 3. Restart the application
docker start cone-counter
```

### Data Migration

```bash
# Export current data
curl http://localhost:3000/api/export > backup.json

# Import to new instance
curl -X POST http://new-instance:3000/api/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume details
docker volume inspect cone-data

# Remove volume (WARNING: destroys all data)
docker volume rm cone-data

# Create new volume
docker volume create cone-data
```

## 🔒 Security Considerations

### Production Security

1. **Reverse Proxy**: Use nginx/Traefik with SSL termination
2. **Firewall**: Restrict access to necessary ports only
3. **Updates**: Regularly update base images and dependencies
4. **Monitoring**: Implement logging and alerting

### Network Security

```bash
# Restrict container network access
docker run --network host \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  alexschladetsch/cone-counter:latest
```

### Data Security

```bash
# Encrypt data volume (example with LUKS)
# This requires additional setup and is OS-dependent
```

## 📱 Load Balancing

### Multiple Instances

```yaml
version: '3.8'

services:
  cone-counter-1:
    image: alexschladetsch/cone-counter:latest
    volumes:
      - cone-data-1:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000

  cone-counter-2:
    image: alexschladetsch/cone-counter:latest
    volumes:
      - cone-data-2:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000

volumes:
  cone-data-1:
    driver: local
  cone-data-2:
    driver: local
```

**Note**: Multiple instances require shared database or data synchronization strategy.

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Use different port
   docker run -p 3001:3000 alexschladetsch/cone-counter:latest
   ```

2. **Permission Denied**
   ```bash
   # Fix volume permissions
   sudo chown -R 1001:1001 /path/to/data
   ```

3. **Database Locked**
   ```bash
   # Restart container
   docker restart cone-counter
   ```

4. **Memory Issues**
   ```bash
   # Limit container memory
   docker run --memory=512m alexschladetsch/cone-counter:latest
   ```

### Debug Mode

```bash
# Run with debug logging
docker run -e NODE_ENV=development alexschladetsch/cone-counter:latest

# Interactive debugging
docker run -it --entrypoint /bin/sh alexschladetsch/cone-counter:latest
```

## 🔄 Updates and Maintenance

### Rolling Updates

```bash
# 1. Pull new image
docker pull alexschladetsch/cone-counter:latest

# 2. Stop old container
docker stop cone-counter

# 3. Remove old container
docker rm cone-counter

# 4. Start new container
docker run -d --name cone-counter -p 3000:3000 -v cone-data:/app/data alexschladetsch/cone-counter:latest
```

### Automated Updates

```bash
# Watchtower for automatic updates
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 \
  cone-counter
```

## 📋 Deployment Checklist

- [ ] Build and test Docker image locally
- [ ] Configure environment variables
- [ ] Set up persistent data volume
- [ ] Configure reverse proxy (if needed)
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Test health check endpoint
- [ ] Verify data persistence
- [ ] Set up monitoring and logging
- [ ] Document deployment configuration
- [ ] Plan backup and recovery procedures

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Nginx Configuration**: https://nginx.org/en/docs/
- **Traefik Documentation**: https://doc.traefik.io/
- **SSL Certificates**: https://letsencrypt.org/

---

**Deployment Version**: 1.0.0  
**Last Updated**: January 2025
