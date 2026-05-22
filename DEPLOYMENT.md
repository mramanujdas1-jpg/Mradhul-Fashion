# Mradhul Fashion Platform - Deployment & Build Guide

This document describes how to deploy the **Mradhul Fashion** backend, frontend, and build the React Native Expo app as a production APK.

---

## 1. Backend Deployment (Render)

Render is a premium, cloud platform ideal for hosting the Node.js Express server.

### Prerequisites
- Create a MongoDB Atlas cluster (free tier works perfectly).
- Obtain your MongoDB connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/mradhul_fashion?retryWrites=true&w=majority`).

### Steps
1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log into your [Render Dashboard](https://dashboard.render.com/) and click **New** ➔ **Web Service**.
3. Link your Git repository containing the `mradhul-fashion` project.
4. Set the following service parameters:
   - **Name**: `mradhul-fashion-api`
   - **Region**: Select a region close to your user base.
   - **Branch**: `main`
   - **Root Directory**: `backend` (Important: points to the subfolder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Advanced** and add the following **Environment Variables**:
   - `PORT`: `5000` (Render will override if needed, but defaults are fine)
   - `MONGO_URI`: *[Your MongoDB Atlas Connection String]*
   - `JWT_SECRET`: *[A secure random string used for JWT signature]*
   - `RAZORPAY_KEY_ID`: *[Your Razorpay test key, if integrating]*
   - `RAZORPAY_KEY_SECRET`: *[Your Razorpay secret key, if integrating]*
6. Click **Create Web Service**. Render will build and deploy your API. Once deployment completes, note down the API URL (e.g. `https://mradhul-fashion-api.onrender.com`).
7. **Database Seeding**: Once online, seed the database with mock products.
   - You can connect via SSH on Render and run `npm run seed` in your service terminal, or trigger seeding by running it locally while pointing the `MONGO_URI` to your Atlas cluster.

---

## 2. Frontend Deployment (Vercel)

Next.js projects deploy natively to Vercel with automatic configuration.

### Steps
1. Log into your [Vercel Dashboard](https://vercel.com/) and click **Add New** ➔ **Project**.
2. Import the Git repository containing the `mradhul-fashion` project.
3. Configure the following project parameters:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `web` (Important: points to the Next.js subfolder)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://mradhul-fashion-api.onrender.com/api` (Point this to your backend service deployed on Render)
5. Click **Deploy**. Vercel will install dependencies, compile the production bundle, and assign your site a custom URL (e.g., `https://mradhul-fashion.vercel.app`).

---

## 3. Mobile App APK Build (Expo EAS)

To package your React Native mobile app into an installable Android APK (`.apk` file), use **Expo Application Services (EAS)**.

### Prerequisites
- Install **Node.js** locally.
- Install the **EAS CLI** globally:
  ```bash
  npm install -g eas-cli
  ```
- Register a free developer account at [Expo.dev](https://expo.dev).

### Steps

#### Step 1: Configure EAS Build (`eas.json`)
Make sure there is a configuration profile for building APKs. In your `mobile/` directory, create or modify `eas.json` with the following configuration:
```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```
> [!NOTE]
> The `preview` profile compiles the app directly into a `.apk` file which can be shared and sideloaded onto physical Android devices. The `production` profile generates an `.aab` file for Google Play Console submission.

#### Step 2: Initialize EAS Project
In your command terminal, navigate to the `mobile` folder and log into your Expo account:
```bash
cd mobile
eas login
```

Initialize the EAS configuration for the app:
```bash
eas project:init
```

#### Step 3: Configure Env Variables for Mobile Build
Before building, ensure the API endpoint is configured for the production API. In `mobile/app.json` or `mobile/context.js`, update the fallback `API_HOST` pointing to the deployed Render server:
```javascript
// Example modification in mobile/context.js or environment config
const API_HOST = 'https://mradhul-fashion-api.onrender.com/api';
```

#### Step 4: Run the Build Command
To trigger the EAS build for Android and generate a sideloadable APK:
```bash
eas build --platform android --profile preview
```

1. EAS will ask you to login if you haven't, and will then configure keystores and build files.
2. The build process runs remotely on Expo's build servers.
3. Once completed, EAS will provide a direct download link to the `.apk` file (and a QR code that you can scan on your Android device to install the app immediately).

---

## 4. Local Run & Verification
To test the complete stack locally:

1. **Start MongoDB**: Ensure your local MongoDB server is active (`mongod`).
2. **Seed Database**:
   ```bash
   cd backend
   npm run seed
   ```
3. **Start API**:
   ```bash
   cd backend
   npm run dev
   ```
4. **Start Web Portal**:
   ```bash
   cd web
   npm run dev
   ```
5. **Start Mobile App**:
   ```bash
   cd mobile
   npm run android  # or npm run ios
   ```
