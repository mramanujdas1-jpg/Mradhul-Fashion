import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let auth = null;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export const getFirebaseAuth = () => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase mobile configuration is missing. Check EXPO_PUBLIC_FIREBASE_* env values.');
  }
  return auth;
};

export const signInWithEmail = async (email, password) => {
  if (!auth) throw new Error("Auth not initialized");
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email, password, name) => {
  if (!auth) throw new Error("Auth not initialized");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential;
};

export const logOut = async () => {
  if (!auth) throw new Error("Auth not initialized");
  return signOut(auth);
};

export const onAuthStateChange = (callback) => {
  try {
    if (!auth) {
      setTimeout(() => onAuthStateChange(callback), 100);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  } catch (err) {
    callback(null);
    return () => {};
  }
};
