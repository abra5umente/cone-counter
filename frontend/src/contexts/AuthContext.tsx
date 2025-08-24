import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, isFirebaseReady, getFirebaseInitPromise } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Wait for Firebase to be ready with better error handling
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // First check if Firebase is already ready
        if (isFirebaseReady()) {
          setFirebaseReady(true);
          return;
        }

        // Wait for Firebase initialization to complete
        await getFirebaseInitPromise();
        
        // Double-check that Firebase is ready
        if (isFirebaseReady()) {
          setFirebaseReady(true);
        } else {
          throw new Error('Firebase initialization completed but services are not available');
        }
      } catch (error) {
        console.error('Firebase initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown Firebase error');
        
        // Retry after a delay for mobile devices
        setTimeout(() => {
          if (!firebaseReady) {
            console.log('Retrying Firebase initialization...');
            checkFirebase();
          }
        }, 2000);
      }
    };
    
    checkFirebase();
  }, [firebaseReady]);

  function signUp(email: string, password: string) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not initialized');
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function signIn(email: string, password: string) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not initialized');
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signInWithGoogle() {
    const auth = getFirebaseAuth();
    const googleProvider = getGoogleProvider();
    if (!auth || !googleProvider) throw new Error('Firebase not initialized');
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not initialized');
    return signOut(auth);
  }

  useEffect(() => {
    if (!firebaseReady) return;

    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid} signed in` : 'User signed out');
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseReady]);

  // Show error state if Firebase fails to initialize
  if (initError && !firebaseReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Failed to connect to the service. This might be a temporary issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Error: {initError}
          </p>
        </div>
      </div>
    );
  }

  const value = {
    currentUser,
    loading: loading || !firebaseReady,
    signIn,
    signUp,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && firebaseReady && children}
    </AuthContext.Provider>
  );
}
