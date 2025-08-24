# Google Cloud Run Deployment Guide

This guide will help you deploy your Cone Counter application to Google Cloud Run.

## Prerequisites

1. **Google Cloud CLI** installed and configured
2. **Docker** installed and running
3. **Firebase project** set up with Firestore and Authentication
4. **Environment variables** configured for Firebase

## Quick Deployment

### Option 1: Using PowerShell Script (Windows)
```powershell
# Make sure your environment variables are set
# Then run:
.\deploy-cloudrun.ps1
```

### Option 2: Manual Commands
```bash
# Build the image
docker build -t gcr.io/YOUR_PROJECT_ID/cone-counter:latest .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/cone-counter:latest

# Deploy to Cloud Run
gcloud run deploy cone-counter \
  --image gcr.io/YOUR_PROJECT_ID/cone-counter:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

## Environment Variables

Set these environment variables before deployment:

```powershell
# PowerShell
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
$env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----"
$env:FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
$env:FIREBASE_CLIENT_ID="your-client-id"
$env:FIREBASE_CLIENT_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/..."
```

## Configuration Details

### Port Configuration
- **Application Port**: 8080 (Cloud Run standard)
- **Health Check**: `/api/stats` endpoint
- **Static Files**: Served from `/` (frontend) and `/api/*` (backend)

### Resource Allocation
- **Memory**: 512Mi (minimum for Node.js apps)
- **CPU**: 1 vCPU
- **Max Instances**: 10 (prevents runaway costs)
- **Concurrency**: Default (80 concurrent requests per instance)

### Security
- **Authentication**: Firebase Auth (handled in application)
- **Public Access**: Allowed (Firebase handles user auth)
- **CORS**: Configured for web access

## Monitoring & Debugging

### View Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cone-counter" --limit=50
```

### Check Service Status
```bash
gcloud run services describe cone-counter --region us-central1
```

### Test Health Check
```bash
curl https://your-service-url/api/stats
```

## Cost Optimization

- **Min Instances**: 0 (scales to zero when not in use)
- **Max Instances**: 10 (prevents runaway costs)
- **Memory**: 512Mi (optimal for Node.js apps)
- **CPU**: 1 vCPU (sufficient for most workloads)

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check `.dockerignore` doesn't exclude necessary files
   - Ensure all dependencies are in `package.json`

2. **Runtime Errors**
   - Check logs: `gcloud logging read "resource.type=cloud_run_revision"`
   - Verify environment variables are set correctly

3. **Firebase Connection Issues**
   - Verify service account credentials
   - Check Firestore rules allow read/write access

4. **Port Issues**
   - Application must listen on port 8080 (or PORT env var)
   - Health check must return 200 OK

### Debug Commands

```bash
# Test locally
docker run -p 8080:8080 -e PORT=8080 your-image-name

# Check container logs
docker logs container-name

# Verify environment variables
docker exec container-name env | grep FIREBASE
```

## Updates & Rollbacks

### Deploy New Version
```bash
# Build and push new image
docker build -t gcr.io/YOUR_PROJECT_ID/cone-counter:v2 .
docker push gcr.io/YOUR_PROJECT_ID/cone-counter:v2

# Deploy new version
gcloud run deploy cone-counter \
  --image gcr.io/YOUR_PROJECT_ID/cone-counter:v2 \
  --region us-central1
```

### Rollback
```bash
# List revisions
gcloud run revisions list --service=cone-counter --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic cone-counter \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

## Performance Tips

1. **Cold Start Optimization**
   - Keep dependencies minimal
   - Use `--only=production` in npm install

2. **Memory Management**
   - 512Mi is optimal for Node.js apps
   - Monitor memory usage in Cloud Console

3. **Scaling**
   - Set appropriate max instances
   - Monitor request patterns

## Security Considerations

1. **Firebase Security Rules**
   - Implement proper Firestore rules
   - Use Firebase Auth for user management

2. **Environment Variables**
   - Never commit secrets to version control
   - Use Cloud Run secrets management for production

3. **Network Security**
   - CORS is configured for web access
   - Consider VPC connector for private resources

## Support

For issues with:
- **Cloud Run**: Check Google Cloud documentation
- **Application**: Review logs and check this guide
- **Firebase**: Consult Firebase documentation
