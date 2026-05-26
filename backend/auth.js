const admin = require('firebase-admin');
const { User } = require('./models');

const logInfo = (...args) => {
  console.log('[Auth]', ...args);
};

// Initialize Firebase Admin SDK if configuration exists
let firebaseApp = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logInfo('Firebase Admin SDK initialized successfully via JSON configuration.');
  } catch (err) {
    console.error('Failed to parse and initialize FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
  }
} else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    logInfo('Firebase Admin SDK initialized successfully via individual variables.');
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK via env variables:', err.message);
  }
}

if (!firebaseApp) {
  console.warn('CRITICAL WARNING: Firebase Admin SDK is NOT initialized.');
}

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      logInfo(`Token received for ${req.method} ${req.originalUrl} (${token.substring(0, 20)}...)`);
      
      if (!firebaseApp) {
        console.error('[Auth] CRITICAL: Firebase Admin SDK is not initialized — cannot verify tokens');
        return res.status(500).json({ message: 'Authentication server configuration error: Firebase not initialized.' });
      }
      
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().verifyIdToken(token);
        logInfo(`Firebase token verified: uid=${firebaseUser.uid}, email=${firebaseUser.email}`);
      } catch (firebaseErr) {
        console.error('[Auth] Firebase token verification failed:', firebaseErr.code, firebaseErr.message);
        return res.status(401).json({ message: 'Not authorized, Firebase token failed' });
      }
      
      const userId = firebaseUser.uid;
      const email = firebaseUser.email;
      const name = firebaseUser.name || (email ? email.split('@')[0] : 'Fashion Customer');
      
      // Resolve user in local MongoDB (create profile if it doesn't exist)
      let user = await User.findOne({ $or: [{ firebaseUid: userId }, { email }].filter(cond => cond.email || cond.firebaseUid) });
      
      if (!user) {
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        const isWhitelistedAdmin = email && adminEmails.includes(email.toLowerCase());
        
        user = await User.create({
          firebaseUid: userId,
          name: name,
          email: email || `${userId}@mradhul.local`,
          role: isWhitelistedAdmin ? 'admin' : 'customer'
        });
        logInfo(`Created MongoDB profile for new Firebase user: ${email} (${user.role})`);
      } else {
        if (!user.firebaseUid) {
          user.firebaseUid = userId;
          await user.save();
        }
        
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        if (email && adminEmails.includes(email.toLowerCase()) && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
          logInfo(`User ${email} elevated to admin dynamically based on ADMIN_EMAILS environment variable.`);
        }
      }
      
      req.user = user;
      logInfo(`Authenticated: ${user.email} (role=${user.role}, id=${user._id})`);
      next();
    } catch (error) {
      console.error('Error in protect middleware:', error.message);
      res.status(401).json({ message: 'Not authorized, login failed' });
    }
  } else {
    logInfo(`No token provided for ${req.method} ${req.originalUrl}`);
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    logInfo(`Admin access granted for ${req.user.email} on ${req.method} ${req.originalUrl}`);
    next();
  } else {
    console.error(`[Auth] Admin access DENIED for ${req.user?.email} (role=${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin: adminCheck };
