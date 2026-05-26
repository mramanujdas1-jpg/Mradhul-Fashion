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

  // Validate critical config values exist
  if (!firebaseConfig.apiKey) {
    console.error('[Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is missing');
    throw new Error('Firebase Configuration Error: NEXT_PUBLIC_FIREBASE_API_KEY is not configured.');
  }
  if (!firebaseConfig.authDomain) {
    console.error('[Firebase] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing');
  }
  if (!firebaseConfig.projectId) {
    console.error('[Firebase] NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing');
  }

  console.log('[Firebase] Initializing with config:', {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId
  });

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  return auth;
};

/**
 * Ensures browser-local persistence is set exactly once.
 * This prevents sessions from being lost on page reload in production.
 */
const ensurePersistence = async () => {
  if (persistenceSet) return;
  const firebaseAuth = getFirebaseAuth();
  try {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    persistenceSet = true;
    console.log('[Auth] Persistence set to browserLocalPersistence');
  } catch (err) {
    console.warn('[Auth] Failed to set persistence:', err.code, err.message);
  }
};

/**
 * Creates a GoogleAuthProvider with correct custom parameters.
 * prompt: 'select_account' forces account chooser every time,
 * which prevents stale credential errors on production.
 */
const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  // Request email and profile scopes explicitly
  provider.addScope('email');
  provider.addScope('profile');
  return provider;
};

/**
 * Classifies Firebase auth errors into user-friendly messages.
 */
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
      return 'This domain is not authorized for Google Sign-In. The site administrator needs to add this domain in Firebase Console → Authentication → Settings → Authorized domains.';
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

  console.log('[Auth] Google sign-in initiated');
  console.log('[Auth] Current domain:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
  console.log('[Auth] Auth domain configured:', firebaseConfig.authDomain);

  // Detect mobile or in-app browsers where popups commonly fail
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const isInAppBrowser = typeof navigator !== 'undefined' && /FBAN|FBAV|Instagram|Twitter|Line/i.test(navigator.userAgent);

  if (isMobile || isInAppBrowser) {
    console.log('[Auth] Mobile/in-app browser detected → using signInWithRedirect');
    return signInWithRedirect(firebaseAuth, provider);
  }

  // Desktop: try popup first, fall back to redirect
  try {
    console.log('[Auth] Attempting signInWithPopup...');
    const result = await signInWithPopup(firebaseAuth, provider);
    console.log('[Auth] Popup success:', result.user.email, 'UID:', result.user.uid);
    return result;
  } catch (error) {
    console.error('[Auth] Popup failed:', error.code, error.message);
    
    // Fall back to redirect for recoverable popup issues
    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      console.log('[Auth] Falling back to signInWithRedirect...');
      return signInWithRedirect(firebaseAuth, provider);
    }

    // For all other errors (invalid-credential, unauthorized-domain, etc.), throw with clean message
    throw error;
  }
};

export const processRedirectResult = async () => {
  const firebaseAuth = getFirebaseAuth();
  try {
    console.log('[Auth] Checking for redirect result...');
    const result = await getRedirectResult(firebaseAuth);
    if (result) {
      console.log('[Auth] Redirect result found:', result.user.email, 'UID:', result.user.uid);
    } else {
      console.log('[Auth] No pending redirect result (normal page load)');
    }
    return result;
  } catch (error) {
    console.error('[Auth] Redirect result processing failed:', error.code, error.message);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const signUpWithEmail = async (email, password, name) => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return credential;
};

export const sendOTP = async (phoneNumber, containerId) => {
  const firebaseAuth = getFirebaseAuth();
  await ensurePersistence();
  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible'
  });
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
  } catch (err) {
    console.warn(err.message);
    callback(null);
    return () => {};
  }
};

export const isMock = false;
