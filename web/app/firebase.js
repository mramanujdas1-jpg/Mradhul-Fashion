import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let auth = null;
let persistenceSet = false;

const getFirebaseAuth = () => {
  if (auth) return auth;

  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase Configuration Error: NEXT_PUBLIC_FIREBASE_API_KEY is not configured.');
  }
  if (!firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error('Firebase Configuration Error: authDomain and projectId are required.');
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  return auth;
};

const ensurePersistence = async () => {
  if (persistenceSet) return;
  const firebaseAuth = getFirebaseAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  persistenceSet = true;
};

const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('email');
  provider.addScope('profile');
  return provider;
};

export const getAuthErrorMessage = (error) => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups for this site, or try the mobile login flow.';
    case 'auth/popup-closed-by-user':
      return 'You closed the sign-in window before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/invalid-credential':
      return 'Google sign-in credential was invalid. This usually means your session expired. Please try signing in again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In. Add this domain in Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable it in Firebase Console > Authentication > Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with a different sign-in method. Try signing in with email/password instead.';
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please try again in a few moments.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please create an account first.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
};

export const signInWithGoogle = async () => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  const provider = createGoogleProvider();

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const isInAppBrowser = typeof navigator !== 'undefined' && /FBAN|FBAV|Instagram|Twitter|Line/i.test(navigator.userAgent);

  if (isMobile || isInAppBrowser) {
    return signInWithRedirect(firebaseAuth, provider);
  }

  try {
    return await signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      return signInWithRedirect(firebaseAuth, provider);
    }
    throw error;
  }
};

export const processRedirectResult = async () => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  return getRedirectResult(firebaseAuth);
};

export const signInWithEmail = async (email, password) => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const signUpWithEmail = async (email, password, name) => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
};

export const sendOTP = async (phoneNumber, containerId) => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  firebaseAuth.languageCode = 'en';

  if (typeof window !== 'undefined' && window.recaptchaVerifier?.clear) {
    window.recaptchaVerifier.clear();
  }

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible'
  });

  if (typeof window !== 'undefined') {
    window.recaptchaVerifier = verifier;
  }

  return signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
};

export const logOut = async () => {
  const firebaseAuth = getFirebaseAuth();
  return signOut(firebaseAuth);
};

export const onAuthStateChange = (callback) => {
  try {
    const firebaseAuth = getFirebaseAuth();
    return firebaseAuth.onAuthStateChanged(callback);
  } catch {
    callback(null);
    return () => {};
  }
};

export const isMock = false;
