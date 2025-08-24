# Authentication Debugging Guide

## Step 1: Test the Health Endpoint

First, let's test if the backend is running and has the right environment variables:

```bash
curl https://bongs.midgard-realm.xyz/api/health
```

This should return something like:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "firebaseProjectId": "SET",
  "firebaseClientEmail": "SET", 
  "firebasePrivateKey": "SET (length: 1234)"
}
```

If any of these show "MISSING", that's your problem - the environment variables aren't set correctly in Google Cloud Run.

## Step 2: Test the Firebase Config Endpoint

Test if the frontend Firebase configuration is being served correctly:

```bash
curl https://bongs.midgard-realm.xyz/api/firebase-config
```

This should return your Firebase configuration (without the API key being logged to console now).

## Step 3: Test Authentication Endpoint

Test the authentication without any database operations:

```bash
# You'll need to get a valid token from the frontend first
# Then use it like this:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     https://bongs.midgard-realm.xyz/api/auth-test
```

## Step 4: Check Cloud Run Logs

Check the detailed logs to see what's happening:

```bash
gcloud run services logs read cone-counter --region=your-region --limit=50
```

Look for:
- Firebase Admin SDK initialization messages
- Token verification attempts
- Any error messages

## Common Issues to Check

### 1. Environment Variables Not Set
If the `/api/health` endpoint shows "MISSING" for any Firebase variables, you need to set them in Google Cloud Run.

### 2. Firebase Admin SDK Not Initialized
Look for "Firebase Admin SDK initialized successfully" in the logs. If you see "Failed to initialize Firebase Admin SDK", there's a problem with your service account credentials.

### 3. Token Verification Failing
If you see "Token verification failed" in the logs, the issue is with the Firebase Admin SDK configuration.

### 4. Wrong Project ID
Make sure the `FIREBASE_PROJECT_ID` in your backend matches the project ID in your frontend Firebase config.

## Quick Fix Checklist

- [ ] `/api/health` shows all Firebase variables as "SET"
- [ ] `/api/firebase-config` returns valid configuration
- [ ] Cloud Run logs show "Firebase Admin SDK initialized successfully"
- [ ] No "Token verification failed" errors in logs
- [ ] Project ID matches between frontend and backend

## Next Steps

1. Test the health endpoint first
2. Check what environment variables are missing
3. Set the missing variables in Google Cloud Run
4. Redeploy the service
5. Test again

Let me know what the health endpoint returns and what you see in the Cloud Run logs!
