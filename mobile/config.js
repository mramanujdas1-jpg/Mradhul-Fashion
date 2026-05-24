export const API_HOST = process.env.EXPO_PUBLIC_API_URL;

export function requireApiHost() {
  if (!API_HOST) {
    throw new Error('EXPO_PUBLIC_API_URL must be configured for the mobile app.');
  }

  return API_HOST.replace(/\/+$/, '');
}
