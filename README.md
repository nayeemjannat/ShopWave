# 🛍️ ShopWave — Multi-Vendor E-Commerce Platform

A full-stack, multi-vendor e-commerce platform built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Redux Toolkit, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, Google OAuth (Passport.js) |
| File Storage | Cloudinary |
| Payment | SSLCommerz |
| Email | Brevo (SMTP) |
| AI | Google Gemini, Groq |
| Messaging | Twilio (WhatsApp) |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/shopwave.git
cd shopwave
```

### 2. Setup Server
```bash
cd server
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev
```

### 3. Setup Client
```bash
cd client
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm install
npm run dev
```

---

## 🔐 Environment Variables

### Server (`server/.env`)

Copy `server/.env.example` and fill in the values:

```
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/shopwave

JWT_SECRET=<minimum_32_char_random_string>

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

GEMINI_API_KEY=
GROQ_API_KEY=

SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_LIVE=false

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000
VITE_STORE_SLUG=demo
```

> ⚠️ **Never commit `.env` files to GitHub. They are gitignored.**

---

## 📁 Project Structure

```
shopwave/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/       # Redux slices
│   │   └── utils/
│   └── .env.example
│
└── server/          # Express.js backend
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── config/
    ├── utils/
    ├── scripts/     # DB seeding scripts
    └── .env.example
```

---

## 🌐 Deployment

- **Frontend:** Vercel
- **Backend:** Render / Railway / VPS
- **Database:** MongoDB Atlas

---

## 📄 License

MIT License — feel free to use and modify.
