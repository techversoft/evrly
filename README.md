# Evrly - Your Customized GiftStore | Premium Customized Gifting Multi-Vendor Marketplace

Evrly - Your Customized GiftStore is a production-ready, highly scalable multi-vendor e-commerce marketplace dedicated strictly to personalized gifts (such as engraved photo frames, magic coffee mugs, customized surprise explosion boxes, and corporate gifting items). 

Developed with a modern decoupled architecture, it enables customers to purchase tailor-made gifts, approved vendors to list customizable specifications, and platform administrators to moderate listings.

---

## 🏗️ System Architecture

The project is split into two cleanly decoupled services:
- **`/client`**: Next.js App Router frontend with Tailwind CSS, fully responsive layouts, client route-level session security, and dynamic SEO optimization.
- **`/server`**: Node.js & Express backend using the MVC architecture, structured REST APIs, Mongoose models, and robust rate-limiting.

---

## 📁 Project Folder Structure

```
Surprizo/
├── client/                     # Next.js Frontend Application
│   ├── public/                 # Static brand assets (Logo, Favicon)
│   └── src/
│       ├── app/                # App Router Page Routes (Admin, Seller, Products, Checkout)
│       ├── components/         # Shared visual components (Navbar, Filters, CustomizationForm)
│       ├── context/            # Context hooks (CartContext)
│       └── utils/              # API and formatting helpers
│
└── server/                     # Node.js + Express REST API Server
    ├── config/                 # Config engines (Database connections)
    ├── controllers/            # Request handlers (auth, admin, product, seller, order)
    ├── middlewares/            # Middlewares (protect, approvedSeller, rateLimiter, error)
    ├── models/                 # Mongoose schemas (User, Product, Order, Review, Category)
    ├── routes/                 # Express API routes
    ├── services/               # Integration drivers (Cloudinary, Razorpay)
    └── utils/                  # Bootstrapping and token utilities
```

---

## 🔑 Environment Variables Configuration

### Frontend Configurations (`/client/.env`)
Create a `.env` file in the `/client` directory with the following variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_jwt_secret_key_minimum_32_characters

# Google OAuth Integration (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Optional Production Analytics Keys (Keep blank to disable)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_PIXEL_ID=
```

### Backend Configurations (`/server/.env`)
Create a `.env` file in the `/server` directory with the following variables:
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/evrly_customized_giftstore
JWT_SECRET=your_backend_jwt_hash_secret_key

# Admin Bootstrap Account (Creates on npm run clean-db)
ADMIN_EMAIL=admin@surprizo.com
ADMIN_PASSWORD=password123

# Cloudinary Integration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Checkout Credentials (Required for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🚀 Local Development Setup

### 1. Database Wiping & Initial Bootstrapping
Before starting the servers, you must run the database cleanup script to wipe development placeholders, seed standard catalog categories, and bootstrap the system administrator account:
```bash
# In the /server directory
npm install
npm run clean-db
```

### 2. Launching Services
Run the backend server and frontend client concurrently:

**Run Express Backend Server:**
```bash
# In the /server directory
npm run dev
# Server runs on port 5000
```

**Run Next.js Client Frontend:**
```bash
# In the /client directory
npm install
npm run dev
# Client runs on port 3000
```

---

## 💼 Workflows & Portals Guide

### 1. Seller Onboarding & Listing Flow
- **Register**: A vendor creates an account under the **Seller Shop** registration type, filling out GSTIN and bank payout details.
- **Verification**: On first login, the seller dashboard displays a **Pending Verification** warning banner. Product listing buttons are disabled and protected.
- **Approval**: The platform administrator logs into `/admin/dashboard` to review applications. Once approved, the warning is lifted on the seller's portal.
- **Inventory Listing**: The verified seller can now create custom products, define required customization fields (Short text, messages, image uploads), and set pricing.
- **Moderation**: Newly created products are marked as *Pending Moderation*. They appear in the public catalog only after an admin approves the specific listing.

### 2. Platform Admin Dashboard
Accessible at `/admin/dashboard` only by accounts carrying the `admin` role. 
Administrators can:
- Review and verify pending seller applications.
- Audit and moderate product listing submissions.
- Monitor global transactions, sales earnings, and order items statuses.
- Update roles and permissions for registered customer accounts.

---

## 📦 Production Deployment Checklist
Please refer to the detailed [production-checklist.md](file:///c:/Users/hp/OneDrive/Desktop/Surprizo/production-checklist.md) file at the project root for guidance on:
- Production environment configurations.
- SSL Header configurations and Rate Limiter tuning.
- Razorpay payments webhook signatures verification.
- Sitemap crawls and Google Search Console indexing.
- Bundle sizes and performance optimizations.
