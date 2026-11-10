import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged,
  signOut,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithApple: () => Promise<User | null>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'email-link' | 'phone';
  openAuthModal: (mode?: 'login' | 'signup' | 'email-link' | 'phone') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'email-link' | 'phone'>('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const email = user.email?.toLowerCase();
          if (email === 'admin@jaknooma.com' || email === 'dark.habib84@gmail.com') {
             setIsAdmin(true);
             // Optionally ensure the document is created
          } else {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setIsAdmin(adminDoc.exists());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'admins');
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithApple = async (): Promise<User | null> => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    provider.setCustomParameters({
      locale: 'ar'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      if (loggedInUser) {
        try {
          const userRef = doc(db, 'users', loggedInUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: loggedInUser.uid,
              email: loggedInUser.email || '',
              displayName: loggedInUser.displayName || 'مستخدم آبل',
              photoURL: loggedInUser.photoURL || '',
              provider: 'apple',
              createdAt: new Date().toISOString()
            });
          }
        } catch (firestoreError) {
          console.error('Error saving Apple user to Firestore:', firestoreError);
        }
      }

      setIsAuthModalOpen(false);
      return loggedInUser;
    } catch (error: any) {
      // في حال حظر المتصفح للـ Popup في بيئة الهواتف نحوله إلى Redirect
      if (Capacitor.isNativePlatform() && error?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const openAuthModal = (mode: 'login' | 'signup' | 'email-link' | 'phone' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAdmin, 
        loading, 
        logout, 
        loginWithApple, 
        isAuthModalOpen, 
        authModalMode, 
        openAuthModal, 
        closeAuthModal 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
