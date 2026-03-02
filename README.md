# AFINJU — Luxury E-Commerce Platform

A world-class luxury e-commerce website for the AFINJU brand (Nigeria, NGN pricing). Built with React + TypeScript + Vite + Tailwind CSS + shadcn/ui, Firebase (Auth, Firestore, Cloud Functions), Cloudinary, and Paystack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (cart + auth) |
| Data Fetching | TanStack Query v5 |
| Animation | Framer Motion |
| Backend | Firebase Auth, Firestore, Cloud Functions (Node 18 / TS) |
| Payments | Paystack (inline + webhook verification) |
| Media | Cloudinary (signed admin uploads, optimised delivery) |
| Deployment | Vercel (frontend) + Firebase (functions + hosting) |

---

## Project Structure

```
afinju/
├── src/
│   ├── App.tsx                   # All routes
│   ├── components/
│   │   ├── layout/               # Navbar, Footer
│   │   ├── shared/               # ScarcityCounter, WhatsAppFAB, PaystackScript
│   │   └── ui/                   # shadcn components
│   ├── features/
│   │   ├── auth/                 # AuthProvider, route Guards
│   │   └── cart/                 # CartDrawer
│   ├── lib/
│   │   ├── firebase.ts           # Firebase app init
│   │   ├── db.ts                 # Firestore CRUD layer
│   │   ├── paystack.ts           # Paystack helpers
│   │   ├── cloudinary.ts         # Image URL transforms
│   │   └── utils.ts              # Shared utilities
│   ├── pages/
│   │   ├── admin/                # Full admin dashboard
│   │   └── account/              # Customer account + orders
│   ├── store/
│   │   ├── cart.ts               # Zustand cart store
│   │   └── auth.ts               # Zustand auth store
│   └── types/index.ts            # All TypeScript types
├── functions/
│   └── src/index.ts              # Cloud Functions (payment, webhooks, roles)
├── scripts/seed.ts               # Firestore seed script
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Composite indexes
├── firebase.json                 # Firebase project config
└── .env.example                  # Environment variable template
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (Blaze plan required for Cloud Functions)
- A Paystack account
- A Cloudinary account

---

### 1. Clone and Install

```bash
git clone https://github.com/your-org/afinju.git
cd afinju
npm install
cd functions && npm install && cd ..
```

---

### 2. Firebase Setup

**Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com).

Enable the following services:
- Authentication → Email/Password sign-in method
- Firestore Database → Start in production mode
- Cloud Functions (requires Blaze plan)

**Get your Firebase config:**

Console → Project Settings → Your apps → Web app → SDK setup

---

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=afinju_unsigned
```

---

### 4. Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. In Settings → Upload Presets, create a preset named `afinju_unsigned` with **Unsigned** mode.
3. Set the folder to `afinju` and restrict to images only.
4. Copy your **Cloud Name** into `VITE_CLOUDINARY_CLOUD_NAME`.

---

### 5. Paystack Setup

1. Create an account at [paystack.com](https://paystack.com).
2. Go to Settings → API Keys & Webhooks.
3. Copy your **public key** (starts with `pk_`) into `.env.local`.
4. Configure a webhook URL pointing to your deployed Cloud Function:
   `https://us-central1-YOUR_PROJECT.cloudfunctions.net/paystackWebhook`
5. Note the **webhook secret** for the functions config step below.

---

### 6. Firebase Functions Config

Set server-side secrets (never put these in `.env.local`):

```bash
firebase login
firebase use YOUR_PROJECT_ID

firebase functions:config:set \
  paystack.secret_key="sk_live_YOUR_SECRET_KEY" \
  paystack.webhook_secret="YOUR_WEBHOOK_SECRET" \
  bootstrap.secret="a-long-random-string-for-first-admin-setup"
```

---

### 7. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

### 8. Seed Initial Data

Generate a Firebase service account key:
- Console → Project Settings → Service accounts → Generate new private key
- Save as `service-account.json` in the project root (add to `.gitignore`)

```bash
npx tsx scripts/seed.ts
```

This creates the AFINJU Authority Set product, homepage content, and default store settings.

---

### 9. Deploy Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

---

### 10. Run Locally

```bash
npm run dev
```

For full local development with Firebase emulators:

```bash
firebase emulators:start
# In a separate terminal:
VITE_USE_EMULATORS=true npm run dev
```

---

## Creating the First Admin User

Follow these steps to promote your first user to the `admin` role.

**Step 1:** Create a regular account at `/signup` using your intended admin email.

**Step 2:** Find the user's UID in Firebase Console → Authentication → Users.

**Step 3:** Use the bootstrap endpoint (one-time use, then disable it):

```
GET https://us-central1-YOUR_PROJECT.cloudfunctions.net/bootstrapAdmin
  ?uid=USER_UID_HERE
  &secret=YOUR_BOOTSTRAP_SECRET
```

The `YOUR_BOOTSTRAP_SECRET` is the value you set in `bootstrap.secret` above.

**Step 4:** Ask the user to sign out and sign back in so the new custom claim takes effect.

**Step 5:** That user can now use the `/admin` dashboard and can assign `staff` or `admin` roles to other users via the `setAdminRole` Cloud Function.

> **Important:** After creating your first admin, remove or change the `bootstrap.secret` in your functions config and redeploy to prevent misuse.

---

## Admin Dashboard

The admin dashboard at `/admin` is protected by role-based access control. It provides:

- **Overview:** Revenue KPIs, order counts, launch edition progress bar
- **Orders:** Full order list with status/payment filters, CSV export, per-order detail
- **Order Detail:** Customer info, one-click call/WhatsApp/email outreach, status updates with customer-facing and internal notes
- **Products:** Create/edit products, Cloudinary image uploads, inventory management
- **Customers:** Full customer list with outreach links
- **Content:** Homepage hero text, announcement bar, scarcity banner toggles
- **Settings:** Store settings, Paystack public key, shipping fees, social links
- **Analytics:** Revenue KPIs, order status breakdown, colour and size demand charts

---

## Payment Flow

1. Customer completes checkout form → pending order created in Firestore with `paymentStatus: 'unpaid'`
2. Paystack inline payment modal opens
3. On Paystack success callback → `verifyPayment` Cloud Function called
4. Function verifies payment server-side with Paystack API, checks amount, enforces inventory limit in a Firestore transaction
5. Order updated to `paymentStatus: 'paid'` → inventory decremented atomically
6. As fallback: Paystack webhook calls `paystackWebhook` function and performs the same verification if the client-side flow is interrupted

This two-layer verification (callable function + webhook) ensures no order is confirmed without actual payment, and no payment triggers a double inventory deduction.

---

## Deployment

**Frontend (Vercel):**

```bash
npm run build
# Deploy the `dist/` folder to Vercel
# Or connect your GitHub repo and configure Vercel to auto-deploy
# Set all VITE_* env vars in Vercel project settings
```

**Firebase (Functions + Hosting):**

```bash
firebase deploy
```

---

## Security Notes

- The Paystack secret key is stored exclusively in Firebase Functions config, never in client code or `.env` files
- Firestore security rules prevent customers from reading others' orders, and prevent self-promotion to admin roles
- Inventory decrement is performed in a Firestore transaction inside the Cloud Function, preventing race conditions and overselling
- The `bootstrapAdmin` HTTP endpoint should be disabled (remove from config) after initial setup

---

## WhatsApp Channel

The brand's primary WhatsApp contact is `+2347071861932`. It is used as a secondary conversion channel throughout the site:

- Floating WhatsApp FAB on all public pages
- "Need help with sizing?" deep-link on product pages
- Order confirmation WhatsApp link prefilled with order number
- Admin dashboard outreach buttons

Primary purchases are processed through Paystack checkout.

---

## License

Proprietary. All rights reserved. AFINJU, 2024.
