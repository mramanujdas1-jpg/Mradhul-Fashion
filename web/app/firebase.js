import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
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

const getFirebaseAuth = () => {
  if (auth) return auth;
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase Configuration Error: NEXT_PUBLIC_FIREBASE_API_KEY is not configured.');
  }
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  return auth;
};

export const signInWithGoogle = async () => {
  const firebaseAuth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  console.log('[Auth] Google popup flow initiated');
  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    console.log('[Auth] Google popup success:', result.user.email);
    return result;
  } catch (error) {
    console.error('[Auth] Google popup failed:', error.code, error.message);
    
    // Automatically switch to redirect flow on mobile devices or if popup is blocked
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || /Mobi|Android/i.test(navigator.userAgent)) {
      console.log('[Auth] Falling back to signInWithRedirect due to mobile device or popup blocking');
      return signInWithRedirect(firebaseAuth, provider);
    }
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  const firebaseAuth = getFirebaseAuth();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const signUpWithEmail = async (email, password, name) => {
  const firebaseAuth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return credential;
};

export const sendOTP = async (phoneNumber, containerId) => {
  const firebaseAuth = getFirebaseAuth();
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
