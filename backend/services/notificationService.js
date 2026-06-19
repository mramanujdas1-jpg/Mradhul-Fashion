const admin = require('firebase-admin');

let fcmInitialized = false;

try {
  if (admin.apps.length > 0) {
    // Firebase Admin already initialized by auth.js — reuse it
    fcmInitialized = true;
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    fcmInitialized = true;
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    fcmInitialized = true;
  } else {
    console.warn('Firebase Admin credentials missing. Push notifications are disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin for notifications:', error.message);
}


/**
 * Sends a push notification to a specific list of FCM tokens.
 * @param {Array<string>} tokens - List of FCM registration tokens.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {Object} data - Optional extra data payload.
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  const uniqueTokens = [...new Set((tokens || []).filter(Boolean))];
  if (!fcmInitialized || uniqueTokens.length === 0) return { success: 0, failure: 0, failedTokens: [] };

  const batches = [];
  for (let i = 0; i < uniqueTokens.length; i += 500) {
    batches.push(uniqueTokens.slice(i, i + 500));
  }

  try {
    let success = 0;
    let failure = 0;
    const failedTokens = [];

    for (const batch of batches) {
      const response = await admin.messaging().sendEachForMulticast({
        notification: { title, body },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        tokens: batch,
      });

      success += response.successCount;
      failure += response.failureCount;
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(batch[idx]);
        }
      });
    }

    return { success, failure, failedTokens };
  } catch (error) {
    console.error('Error sending push notification:', error.message);
    return { success: 0, failure: uniqueTokens.length, failedTokens: uniqueTokens, error: error.message };
  }
};

/**
 * High-level wrapper for Order Updates
 */
const notifyOrderStatusChange = async (user, orderId, status) => {
  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;
  const title = `Order Update: ${status}`;
  const body = `Your order ${orderId} has been updated to ${status}.`;
  await sendPushNotification(user.fcmTokens, title, body, { type: 'order', orderId: orderId.toString() });
};

module.exports = {
  sendPushNotification,
  notifyOrderStatusChange
};
