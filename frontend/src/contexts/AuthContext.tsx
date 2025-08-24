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
import { getFirebaseAuth, getGoogleProvider } from '../firebase';

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

  // Wait for Firebase to be ready
  useEffect(() => {
    const checkFirebase = () => {
      const auth = getFirebaseAuth();
      if (auth) {
        setFirebaseReady(true);
      } else {
        // Check again in a moment
        setTimeout(checkFirebase, 100);
      }
    };
    
    checkFirebase();
  }, []);

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
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseReady]);

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
