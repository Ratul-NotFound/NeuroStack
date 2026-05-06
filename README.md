# Personal AI-Powered Knowledge Hub

A production-ready, automation-first knowledge repository that collects, summarizes, and categorizes content from your favorite sources using Gemini 1.5 Flash.

## Features

- **Daily Automation**: Automatically fetches new content from RSS feeds.
- **AI Summarization**: Uses Gemini 1.5 Flash to create concise markdown summaries.
- **Smart Caching**: IndexedDB-based client-side cache minimizes Firestore reads.
- **Admin Panel**: Manage sources, categories, and create manual entries.
- **PWA Ready**: Installable on mobile and desktop with offline support.
- **Zero Cost**: Stays within free tiers of Firebase, Gemini, and GitHub Actions.

## Setup Instructions

### 1. Firebase Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** in production mode.
3. Enable **Authentication** with the **Email/Password** provider.
4. Create your first admin user manually in the Auth tab.
5. Go to Project Settings > Service Accounts > Generate new private key. Save this JSON.
6. Create a Web App in Project Settings to get your client-side config keys.

### 2. Google AI (Gemini) Setup
1. Get an API key from [Google AI Studio](https://aistudio.google.com/).

### 3. GitHub Secrets
Add the following secrets to your repository:
- `FIREBASE_SERVICE_ACCOUNT_JSON`: The entire content of your service account JSON key.
- `GEMINI_API_KEY`: Your Gemini API key.

### 4. Deployment
- **Frontend**: Connect your repo to Vercel. Set the root directory to `frontend`. Add your Firebase config as environment variables (prefixed with `VITE_`).
- **Automation**: The GitHub Action in `.github/workflows/daily-fetch.yml` will handle the daily runs.

### 5. Initial Seeding
1. Deploy the frontend and log in.
2. Go to **Management** (Admin) and add your first **Categories** and **Sources**.
3. You can trigger the automation manually from the GitHub Actions tab.

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Automation (Testing)
```bash
cd automation
npm install
# Create .env with required keys
node index.js
```

## Firestore Security Rules
Copy the content of `firestore.rules` to your Firebase Console > Firestore > Rules. Replace `ADMIN_UID_PLACEHOLDER` with your actual user UID.
