import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface DeleteAccountResult {
  success: boolean;
  deletedProductsCount?: number;
  deletedImagesCount?: number;
  anonymizedPaymentsCount?: number;
  appleRevocation?: {
    attempted: boolean;
    revoked: boolean;
    reason?: string;
  };
  message?: string;
}

/**
 * Obtains a fresh Apple authorizationCode / token if the user signed in with Apple,
 * then calls the server-side `POST /api/delete-account` Cloud Function.
 *
 * Strictly server-side deletion only:
 * - No client-side fallback that deletes Firestore/Storage data directly.
 * - Backend deletes user data first, anonymizes payment records, and deletes Firebase Auth user LAST.
 */
export async function executeServerSideAccountDeletion(): Promise<DeleteAccountResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found. Please sign in to verify account ownership.');
  }

  const providerIds = currentUser.providerData.map((p) => p.providerId);
  const isAppleUser = providerIds.includes('apple.com');
  const isGoogleUser = providerIds.includes('google.com');

  let appleAuthorizationCode: string | undefined;
  let appleAccessToken: string | undefined;

  // If the user signed in with Apple, obtain a fresh authorizationCode / token for server-side .p8 revocation
  if (isAppleUser) {
    if (Capacitor.isNativePlatform()) {
      const nativeResult = await FirebaseAuthentication.signInWithApple({
        scopes: ['email', 'name'],
      });
      appleAuthorizationCode = nativeResult.credential?.serverAuthCode;
      appleAccessToken = nativeResult.credential?.accessToken;

      if (nativeResult.credential?.idToken) {
        const provider = new OAuthProvider('apple.com');
        const cred = provider.credential({
          idToken: nativeResult.credential.idToken,
          rawNonce: nativeResult.credential.nonce,
        });
        await reauthenticateWithCredential(currentUser, cred);
      }
    } else {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const popupResult = await signInWithPopup(auth, provider);
      const oauthCred = OAuthProvider.credentialFromResult(popupResult);
      appleAccessToken = oauthCred?.accessToken;
    }
  } else if (isGoogleUser && Capacitor.isNativePlatform()) {
    // Re-verify Google session on native if needed
    try {
      const nativeGoogle = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['profile', 'email'],
      });
      if (nativeGoogle.credential?.idToken || nativeGoogle.credential?.accessToken) {
        const cred = GoogleAuthProvider.credential(
          nativeGoogle.credential?.idToken ?? null,
          nativeGoogle.credential?.accessToken
        );
        await reauthenticateWithCredential(currentUser, cred);
      }
    } catch {
      // Proceed with existing fresh ID token if user already has valid token
    }
  }

  // Force refresh the Firebase ID token to prove active ownership to the server
  const idToken = await currentUser.getIdToken(true);

  const response = await fetch('/api/delete-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      appleAuthorizationCode,
      appleAccessToken,
    }),
  });

  let payload: DeleteAccountResult;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Server returned status ${response.status} while deleting account.`);
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Account deletion failed (HTTP ${response.status}).`);
  }

  // Clear native & local auth session after server confirms complete deletion
  if (Capacitor.isNativePlatform()) {
    try {
      await FirebaseAuthentication.signOut();
    } catch {
      // ignore
    }
  }

  try {
    localStorage.removeItem('cart');
    localStorage.removeItem('emailForSignIn');
  } catch {
    // ignore storage errors
  }

  await signOut(auth).catch(() => {});

  return payload;
}
