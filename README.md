# 🧠 NeuroStack — Personal AI Knowledge Hub

**NeuroStack** is a zero-cost, automation-first personal knowledge repository. It automatically monitors RSS feeds and YouTube channels daily, uses **Gemini 1.5 Flash** to generate structured markdown summaries, and presents everything in a beautiful, PWA-enabled dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Firebase%20%7C%20Gemini-orange)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)

---

## ✨ Features

- 🤖 **AI Summarization** — Gemini 1.5 Flash generates structured markdown summaries with key bullet points
- 🔄 **Daily Auto-Fetch** — GitHub Actions cron runs every day at 06:00 UTC
- 📱 **PWA** — Fully installable on mobile/desktop, works offline with cached content
- ⚡ **Smart Cache** — IndexedDB-backed incremental sync keeps Firestore reads minimal
- 🔐 **Secure Admin Panel** — Firebase Auth (Email/Password), admin-only UID enforcement
- 🌙 **Dark/Light Mode** — Persisted across sessions, respects system preference on first visit
- 📡 **RSS + YouTube RSS** — Supports any RSS feed and YouTube channels (via free public RSS, no API key needed)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | react-router-dom v7 |
| Database | Firebase Firestore (Spark free tier) |
| Auth | Firebase Authentication (Email/Password) |
| AI | Google Gemini 1.5 Flash (free tier) |
| Cache | IndexedDB via `idb` |
| Automation | Node.js + GitHub Actions |
| Deployment | Vercel (frontend) |

---

## 📂 Project Structure

```
NuroStack/
├── .github/workflows/
│   └── daily-fetch.yml         # GitHub Actions cron job
├── automation/
│   ├── fetchers/
│   │   ├── rssFetcher.js       # RSS feed parser
│   │   └── youtubeFetcher.js   # YouTube RSS (no API key needed)
│   ├── .env.example            # Environment variable template
│   ├── firestore.js            # Firebase Admin SDK setup
│   ├── index.js                # Main automation entry point
│   ├── package.json
│   └── summarizer.js           # Gemini AI summarization
├── frontend/
│   ├── public/                 # PWA icons, favicon
│   ├── src/
│   │   ├── components/         # PostCard, Sidebar
│   │   ├── hooks/              # usePostsWithCache (IndexedDB)
│   │   ├── layouts/            # MainLayout, AdminLayout
│   │   ├── lib/                # firebase.js, utils.js
│   │   └── pages/              # Feed, Login, Admin*, PostDetails, NotFound
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── firestore.rules             # Firestore security rules
└── README.md
```

---

## 🛠️ Complete Setup Guide

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Give it a name (e.g., `neurostack`) → Continue
3. Disable Google Analytics (optional) → **Create project**

### Step 2: Enable Firestore

1. In the Firebase console, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** → Select a region → **Done**

### Step 3: Enable Authentication

1. Go to **Build → Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab → Enable **Email/Password**
4. Go to **Users** tab → **Add user**
5. Enter your admin email and a strong password → **Add user**
6. **Copy the User UID** shown in the users table — you'll need this!

### Step 4: Create a Service Account (for automation)

1. Go to **Project Settings** (gear icon) → **Service accounts** tab
2. Click **Generate new private key** → **Generate key**
3. A JSON file will download — keep it safe, you'll use it as a GitHub secret

### Step 5: Get Your Web App Config (for frontend)

1. Go to **Project Settings** → **General** tab
2. Scroll to **Your apps** → **Add app** → Choose **Web** (</>)
3. Register the app → Copy the `firebaseConfig` object
4. Fill in the frontend `.env` file (see Step 7)

### Step 6: Deploy Firestore Security Rules

1. Copy the content of `firestore.rules`
2. In Firebase Console → **Firestore** → **Rules** tab
3. **Replace the content** with the rules and update `ADMIN_UID`:

```
function isAdmin() {
  return request.auth != null && request.auth.uid == "YOUR_UID_HERE";
}
```

4. Click **Publish**

### Step 7: Configure Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_UID=your_admin_uid_from_step_3
```

### Step 8: Seed Initial Categories

After deploying, log in to the admin panel (`/login`) and go to **Categories** → add at minimum:
- AI
- Web Development
- Business
- Science
- General

Or, run the automation once — it will auto-seed defaults if no categories exist.

### Step 9: Add Your First Sources

In the admin panel → **Sources**:
- **Name**: Fireship
- **URL**: `https://www.youtube.com/feeds/videos.xml?channel_id=UCVyRiMvfUNMA1UPlDPzG5Ow`
- **Type**: `rss` *(YouTube channel RSS is also just RSS)*
- **Category**: Web Development

More RSS examples:
| Source | RSS URL |
|--------|---------|
| TechCrunch | `https://techcrunch.com/feed/` |
| Hacker News | `https://news.ycombinator.com/rss` |
| The Verge | `https://www.theverge.com/rss/index.xml` |
| OpenAI Blog | `https://openai.com/news/rss.xml` |

---

## 🔐 GitHub Actions Setup

### Add Repository Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | The **full content** of the service account JSON file downloaded in Step 4 |
| `GEMINI_API_KEY` | Your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) |

### Run the Automation Manually (for testing)

1. Go to your GitHub repo → **Actions** tab
2. Click **Daily AI Content Fetch** workflow
3. Click **Run workflow** → **Run workflow**
4. Watch the logs to confirm sources are being fetched and summarized

---

## 🌐 Vercel Deployment

1. Push this repository to GitHub
2. Go to [Vercel](https://vercel.com/) → **New Project**
3. Import your GitHub repository
4. **Configure project:**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Add Environment Variables** (same as Step 7 above)
6. Click **Deploy**

> The `vercel.json` in the root handles SPA routing (all routes serve `index.html`).

---

## 🗄️ Database Schema

### `sources` collection
```json
{
  "name": "Fireship",
  "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCVyRiMvfUNMA1UPlDPzG5Ow",
  "type": "rss",
  "category": "web-development",
  "lastFetch": null,
  "active": true,
  "createdAt": "Timestamp"
}
```

### `posts` collection
```json
{
  "title": "Article Title",
  "summary": "## Overview\n\n- Bullet point...",
  "link": "https://original.url",
  "sourceName": "Fireship",
  "sourceUrl": "https://fireship.io",
  "category": "web-development",
  "publishedAt": "Timestamp",
  "fetchedAt": "Timestamp",
  "isCustom": false
}
```

### `categories` collection
```json
{
  "id": "web-development",
  "name": "Web Development",
  "order": 1
}
```

---

## 🔧 Local Development

```bash
# Clone the repo
git clone https://github.com/Ratul-NotFound/NuroStack.git
cd NuroStack

# Frontend
cd frontend
npm install
cp .env.example .env   # Fill in your Firebase config
npm run dev            # http://localhost:5173

# Automation (test manually)
cd ../automation
npm install
cp .env.example .env   # Fill in GEMINI_API_KEY
# Place your service-account.json in the automation/ folder
node index.js
```

---

## 📱 PWA Icons

Replace the placeholder icons in `frontend/public/` with your own:
- `pwa-192x192.png` — 192×192 px
- `pwa-512x512.png` — 512×512 px
- `apple-touch-icon.png` — 180×180 px
- `favicon.svg` — scalable favicon

---

## 🛡️ Security Notes

- Firebase client-side config (API keys) are safe to expose — security is enforced by Firestore rules
- The service account JSON **must never be committed to git** — use GitHub secrets only
- `VITE_ADMIN_UID` enforces admin access at the application level; Firestore rules provide the true security layer

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built with ❤️ for the AI-curious. Powered by Gemini, Firebase, and GitHub Actions.*
