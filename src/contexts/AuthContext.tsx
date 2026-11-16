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
import {
  checkUserBannedAsync,
  isUserBannedSync,
  MODERATION_EVENT,
} from '../services/moderationService';
import toast from 'react-hot-toast';
import i18n, { isRtlLanguage } from '../lib/i18n';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isBanned: boolean;
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
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'email-link' | 'phone'>('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const email = currentUser.email?.toLowerCase();
          if (email === 'admin@jaknooma.com' || email === 'dark.habib84@gmail.com') {
            setIsAdmin(true);
            setIsBanned(false);
          } else {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
            setIsAdmin(adminDoc.exists());

            const banned = await checkUserBannedAsync(currentUser.uid, currentUser.email);
            setIsBanned(banned);
            if (banned) {
              const isRtl = isRtlLanguage(i18n.language);
              toast.error(
                isRtl
                  ? 'تم إيقاف حسابك من قبل الإدارة لمخالفة شروط الاستخدام'
                  : 'Your account has been suspended by administration for violating the Terms of Use',
                { duration: 6000 }
              );
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'admins');
          setIsAdmin(false);
          setIsBanned(isUserBannedSync(currentUser.uid, currentUser.email));
        }
      } else {
        setIsAdmin(false);
        setIsBanned(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const syncBan = () => {
      if (!user) {
        setIsBanned(false);
        return;
      }
      const email = user.email?.toLowerCase();
      if (email === 'admin@jaknooma.com' || email === 'dark.habib84@gmail.com') {
        setIsBanned(false);
        return;
      }
      setIsBanned(isUserBannedSync(user.uid, user.email));
    };
    window.addEventListener(MODERATION_EVENT, syncBan);
    return () => window.removeEventListener(MODERATION_EVENT, syncBan);
  }, [user]);

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
        isBanned,
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
