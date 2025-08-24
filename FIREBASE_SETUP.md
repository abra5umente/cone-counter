# Firebase Admin SDK Setup Guide

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file

## Step 2: Configure Environment Variables

Create a `backend.env` file in your project root with these values from your service account JSON:

```bash
# Backend Environment Variables
PORT=3000
NODE_ENV=development

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id-from-json
FIREBASE_PRIVATE_KEY_ID=your-private-key-id-from-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key from JSON\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id-from-json
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

## Step 3: Frontend Environment

Make sure your frontend has a `.env.local` file with:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 4: Test Authentication

1. Start your backend: `npm run dev`
2. Start your frontend: `cd frontend && npm start`
3. Sign in with Google in the frontend
4. The backend should now properly verify Firebase tokens

## Troubleshooting

- **401 errors**: Check that your service account key is correct
- **Token verification failed**: Ensure your Firebase project ID matches
- **Missing environment variables**: Check your `backend.env` file exists and has all required values
