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
    console.log('Attempting to fetch Firebase config from backend...');
    
    // Use a more robust URL construction for mobile
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/firebase-config`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Firebase config response status:', response.status);
    if (response.ok) {
      const config = await response.json();
      console.log('Firebase config received from backend (projectId:', config.projectId, ')');
      
      // Validate the config
      if (!config.projectId || !config.apiKey) {
        throw new Error('Invalid Firebase config received from backend');
      }
      
      // Cache the config in window for future use
      if (typeof window !== 'undefined') {
        (window as any).__FIREBASE_CONFIG__ = config;
      }
      return config;
    } else {
      console.error('Firebase config response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Could not fetch Firebase config from backend:', error);
    console.log('Falling back to build-time config');
  }

  // Fall back to build-time environment variables
  const buildTimeConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  
  console.log('Using build-time Firebase config (projectId:', buildTimeConfig.projectId, ')');
  return buildTimeConfig;
};

// Initialize Firebase asynchronously with retry logic
let app: any;
let auth: any;
let googleProvider: any;
let initializationPromise: Promise<{ app: any; auth: any; googleProvider: any }> | null = null;

const initializeFirebase = async (retryCount = 0): Promise<{ app: any; auth: any; googleProvider: any }> => {
  try {
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

    console.log('Firebase initialized successfully');
    return { app, auth, googleProvider };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    
    // Retry logic for mobile devices
    if (retryCount < 3) {
      console.log(`Firebase init failed, retrying... (${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return initializeFirebase(retryCount + 1);
    }
    
    throw error;
  }
};

// Export the initialization function and getters
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getGoogleProvider = () => googleProvider;

// Initialize Firebase immediately with better error handling
const initPromise = initializeFirebase().catch(error => {
  console.error('Failed to initialize Firebase:', error);
  // Don't throw here, let the app handle the error gracefully
});

// Export a function to check if Firebase is ready
export const isFirebaseReady = () => {
  return !!(app && auth && googleProvider);
};

// Export the initialization promise for components that need to wait
export const getFirebaseInitPromise = () => {
  return initPromise;
};

export default { initializeFirebase, isFirebaseReady, getFirebaseInitPromise };
