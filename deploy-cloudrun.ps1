# Deploy to Google Cloud Run
# Make sure you have gcloud CLI installed and configured

# Configuration
$PROJECT_ID = gcloud config get-value project
$REGION = "us-central1"
$SERVICE_NAME = "cone-counter"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

Write-Host "🚀 Deploying to Google Cloud Run..." -ForegroundColor Green
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Yellow

# Build the Docker image
Write-Host "📦 Building Docker image..." -ForegroundColor Blue
docker build -t $IMAGE_NAME .

# Push to Container Registry
Write-Host "⬆️  Pushing to Container Registry..." -ForegroundColor Blue
docker push $IMAGE_NAME

# Deploy to Cloud Run
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Blue
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --max-instances 10 `
  --set-env-vars NODE_ENV=production `
  --set-env-vars FIREBASE_PROJECT_ID=$env:FIREBASE_PROJECT_ID `
  --set-env-vars FIREBASE_PRIVATE_KEY_ID=$env:FIREBASE_PRIVATE_KEY_ID `
  --set-env-vars FIREBASE_PRIVATE_KEY="$env:FIREBASE_PRIVATE_KEY" `
  --set-env-vars FIREBASE_CLIENT_EMAIL=$env:FIREBASE_CLIENT_EMAIL `
  --set-env-vars FIREBASE_CLIENT_ID=$env:FIREBASE_CLIENT_ID `
  --set-env-vars FIREBASE_CLIENT_CERT_URL=$env:FIREBASE_CLIENT_CERT_URL

Write-Host "✅ Deployment complete!" -ForegroundColor Green
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
Write-Host "🌐 Service URL: $SERVICE_URL" -ForegroundColor Cyan
