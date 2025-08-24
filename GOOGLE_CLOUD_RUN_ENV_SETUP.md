# Google Cloud Run Environment Variables Setup

This guide will help you set up the correct environment variables in Google Cloud Run to fix the 401 authentication errors you're experiencing.

## The Problem

You're getting 401 (Unauthorized) errors because:
1. The backend Firebase Admin SDK needs `FIREBASE_*` environment variables to verify tokens
2. The frontend needs `VITE_FIREBASE_*` environment variables to connect to Firebase
3. The backend `/api/firebase-config` endpoint needs to provide the frontend config

## Required Environment Variables

### Backend Firebase Admin SDK (Required for token verification)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

### Frontend Firebase Client (Required for authentication)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Backend Firebase Config Endpoint (Required for /api/firebase-config)
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
```

### Other Required Variables
```
PORT=3000
NODE_ENV=production
```

## How to Set Environment Variables in Google Cloud Run

### Option 1: Google Cloud Console (Recommended for testing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Cloud Run
3. Select your `cone-counter` service
4. Click "EDIT & DEPLOY NEW REVISION"
5. Scroll down to "Variables & Secrets"
6. Add each environment variable:
   - Click "ADD VARIABLE"
   - Set Name: `FIREBASE_PROJECT_ID`
   - Set Value: `your-actual-project-id`
   - Repeat for all variables
7. Click "DEPLOY"

### Option 2: Google Cloud CLI

```bash
# Set all environment variables at once
gcloud run services update cone-counter \
  --set-env-vars="FIREBASE_PROJECT_ID=your-project-id,FIREBASE_PRIVATE_KEY_ID=your-private-key-id,FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n',FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com,FIREBASE_CLIENT_ID=your-client-id,FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com,VITE_FIREBASE_API_KEY=your-api-key,VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com,VITE_FIREBASE_PROJECT_ID=your-project-id,VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com,VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id,VITE_FIREBASE_APP_ID=your-app-id,FIREBASE_API_KEY=your-api-key,FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com,FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com,FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id,FIREBASE_APP_ID=your-app-id,PORT=3000,NODE_ENV=production" \
  --region=your-region
```

### Option 3: Update your deployment script

If you're using a deployment script, update it to include all these environment variables.

## Getting Firebase Configuration Values

### 1. Firebase Project Settings
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Click "Project settings"

### 2. Frontend Config (General tab)
- **API Key**: Found in the "General" tab
- **Auth Domain**: Usually `your-project-id.firebaseapp.com`
- **Project ID**: Your Firebase project ID
- **Storage Bucket**: Usually `your-project-id.appspot.com`
- **Messaging Sender ID**: Found in the "General" tab
- **App ID**: Found in the "General" tab

### 3. Service Account Key (Service accounts tab)
1. Click "Service accounts" tab
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `private_key_id`
   - `private_key`
   - `client_email`
   - `client_id`
   - `client_x509_cert_url`

## Testing the Fix

After setting the environment variables:

1. **Redeploy your service** (if using CLI or script)
2. **Check the logs** for any initialization errors:
   ```bash
   gcloud run services logs read cone-counter --region=your-region
   ```
3. **Test the Firebase config endpoint**:
   ```bash
   curl https://your-service-url/api/firebase-config
   ```
4. **Test authentication** by logging in again in the frontend

## Common Issues and Solutions

### Issue: "Firebase Admin SDK initialization failed"
**Solution**: Check that all `FIREBASE_*` variables are set correctly, especially the private key format.

### Issue: "Missing Firebase config variables"
**Solution**: Ensure all `FIREBASE_*` variables for the config endpoint are set.

### Issue: Frontend can't connect to Firebase
**Solution**: Verify that `VITE_FIREBASE_*` variables are set and the `/api/firebase-config` endpoint returns valid config.

### Issue: Private key format problems
**Solution**: The private key should include the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers.

## Verification Checklist

- [ ] All `FIREBASE_*` variables are set
- [ ] All `VITE_FIREBASE_*` variables are set
- [ ] Private key includes full key content
- [ ] Service account email is correct
- [ ] Project ID matches across all variables
- [ ] Service has been redeployed
- [ ] `/api/firebase-config` endpoint returns valid config
- [ ] Frontend can authenticate with Firebase
- [ ] Backend can verify Firebase tokens

## Next Steps

After setting these environment variables:
1. Redeploy your service
2. Test the authentication flow
3. Check that data is now being fetched correctly
4. Monitor logs for any remaining issues

If you still have problems after setting all these variables, check the Cloud Run logs for specific error messages that can help identify the issue.
