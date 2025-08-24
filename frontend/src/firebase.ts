import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration - try to get from runtime environment first, then fall back to build-time
const getFirebaseConfig = async () => {
  // Check if we're running in Docker with runtime environment variables
  if (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__) {
    return (window as any).__FIREBASE_CONFIG__;
  }

  // Try to fetch from backend API (for Docker deployment)
  try {
    const response = await fetch('/api/firebase-config');
    if (response.ok) {
      const config = await response.json();
      // Cache the config in window for future use
      if (typeof window !== 'undefined') {
        (window as any).__FIREBASE_CONFIG__ = config;
      }
      return config;
    }
  } catch (error) {
    console.log('Could not fetch Firebase config from backend, using build-time config');
  }

  // Fall back to build-time environment variables
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
};

// Initialize Firebase asynchronously
let app: any;
let auth: any;
let googleProvider: any;

const initializeFirebase = async () => {
  const firebaseConfig = await getFirebaseConfig();

  // Validate required environment variables
  const requiredEnvVars = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingVars = requiredEnvVars.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missingVars.length > 0) {
    console.error('Missing Firebase environment variables:', missingVars);
    console.error('Please check your environment configuration');
    throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
  }

  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);

  // Create Google Auth Provider
  googleProvider = new GoogleAuthProvider();

  return { app, auth, googleProvider };
};

// Export the initialization function and getters
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getGoogleProvider = () => googleProvider;

// Initialize Firebase immediately
initializeFirebase().catch(console.error);

export default { initializeFirebase };
