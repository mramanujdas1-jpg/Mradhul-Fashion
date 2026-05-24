# Mradhul Fashion - Premium Fashion E-Commerce Platform

Mradhul Fashion is a state-of-the-art, premium fashion e-commerce platform inspired by Myntra and Meesho. It incorporates a shared luxury brand identity across a Next.js 15 web application, an Express/MongoDB backend, and a React Native Expo mobile app.

---

## 🌟 Core Features

- **Luxury Branding System**: Implements a curated crimson-red (`#E01A4F`) and metallic gold (`#D4AF37`) color palette, custom logo, typography, and styling assets.
- **Production API First**: Web and mobile clients synchronize through the shared Express API with Firebase Authentication verification.
- **Dynamic Category & Search Navigation**: Responsive sidebar layouts, size/price/gender catalog filters, and instant auto-filtering search bars.
- **Comprehensive Cart & Promotions**: In-bag quantity modifications, flat-rate and value-based free shipping thresholds, and coupon code support (`WELCOME50`, `FESTIVE20`, `MRADHUL10`).
- **Interactive Checkout Flow**: Support for Cash on Delivery (COD) and a fully simulated Razorpay payment gateway.
- **Order Shipment Stepper Tracking**: Color-coded vertical and horizontal tracking progress meters (Pending ➔ Processing ➔ Shipped ➔ Delivered) with custom descriptive milestones.
- **Integrated Admin Dashboard**: Centralized dashboard for managing products, categories, viewing sales analytics, and changing order fulfillment stages.

---

## 📂 Project Folder Structure

```text
mradhul-fashion/
├── backend/               # Node.js, Express.js & MongoDB REST API
│   ├── models.js          # Database schemas (Users, Products, Orders, Banners, Coupons)
│   ├── server.js          # Express server setup and payment integrations
│   ├── seed.js            # Seeder script to initialize mock collections
│   └── routes/            # API endpoints (Auth, Products, Orders, Admin analytics)
├── web/                   # Next.js 15 Web Application (Tailwind CSS & PWA)
│   ├── app/               # Next.js app directory pages (Cart, Checkout, Profile, Admin)
│   ├── components/        # Reusable client views (Navbar, Footer, ProductCard, Banners)
│   └── public/            # Static assets (Favicon, Logo, PWA manifest.json, sw.js)
├── mobile/                # React Native Expo Mobile App
│   ├── App.js             # Main navigation container & tab configuration
│   ├── context.js         # Shared global state (Cart, Wishlist, User Auth, API mapper)
│   ├── assets/            # App icons, splash screen, and branding graphics
│   └── screens/           # Views (HomeScreen, CategoriesScreen, Details, Cart, Profile)
├── branding/              # Raw branding source assets (Logo, Splash, App Icons, Banners)
├── DEPLOYMENT.md          # Guide on deploying to Render, Vercel, and building APKs
└── .env.example           # Shared workspace environment template guidelines
```

---

## 🛠️ Local Setup & Running Instructions

### Step 1: Clone and Initialize Files
Copy the environment files to set up standard defaults:
```bash
# In backend/
cp .env.example .env

# In web/
cp .env.example .env.local
```

### Step 2: Install Dependencies
Install dependencies for each service. Run the command inside each subfolder:
```bash
# Backend dependencies
cd backend
npm install

# Next.js Web dependencies
cd ../web
npm install

# Expo Mobile dependencies
cd ../mobile
npm install
```

### Step 3: Run Database Seeding
Ensure you have a local MongoDB daemon running (`mongod` or Docker container). Run the database seeding command inside the `backend` folder:
```bash
cd backend
npm run seed
```
> This initializes:
> 1. Premium women's heritage fashion categories (Sarees, Lehengas, Anarkalis, Fusion Wear, Jackets & Dupattas).
> 2. Curated handpicked Jaipur ethnic wear products.
> 3. Active promotional storefront banners.

### Step 4: Run Services
Launch all three applications in separate terminal windows:

#### 1. Backend REST API:
```bash
cd backend
npm run dev
# Starts the API using the configured PORT and MONGO_URI
```

#### 2. Next.js Frontend:
```bash
cd web
npm run dev
# Starts the Next.js development server
```

#### 3. React Native Mobile App:
```bash
cd mobile
npm run android  # Or npm run ios / npm start
# Launches Expo Dev Server
```

---

## 🎨 Branding Details

- **Primary Brand Color**: Crimson Red (`#E01A4F` / HSL `344, 79%, 49%`)
- **Secondary Accent**: Luxury Gold (`#D4AF37` / HSL `45, 64%, 52%`)
- **Typography System**: Elegant sans-serif (Inter / Outfit / System default weights)
- **Styling framework**: Tailwind CSS (Web) and React Native StyleSheet (Mobile)

---

## 🚀 Deployment

Refer to the complete deployment configuration instructions in [DEPLOYMENT.md](file:///d:/mradhul-fashion/DEPLOYMENT.md) for details on:
- Setting up the backend on Render.
- Setting up the frontend Next.js application on Vercel.
- Building sideloadable `.apk` mobile packages via EAS Build CLI.
