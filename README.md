# 🧠 NuroStack

**NuroStack** is a zero-cost, automation-first Personal AI Knowledge Hub. It automatically monitors RSS feeds and YouTube channels, uses Gemini 1.5 Flash to summarize complex technical content, and stores everything in a high-performance, searchable dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/Stack-React%20%7C%20Firebase%20%7C%20Gemini-orange)

## ✨ Features

- 🤖 **AI Summarization**: Powered by Google Gemini 1.5 Flash for high-quality technical insights.
- 🍱 **Master-Detail UX**: Modern three-pane interface for lightning-fast content scanning.
- 🔄 **Auto-Fetch Engine**: Automated daily runs via GitHub Actions.
- 📱 **PWA Ready**: Fully responsive and installable on mobile devices.
- 🔐 **Secure Admin**: Protected management panel for managing sources and categories.
- 🎨 **Premium UI**: Crafted with Inter typography and a sophisticated dark-mode aesthetic.

## 🚀 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Firebase Firestore, Firebase Authentication.
- **AI**: Google Gemini 1.5 Flash.
- **Automation**: Node.js, GitHub Actions.

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- A Firebase Project
- A Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ratul-NotFound/NuroStack.git
   cd NuroStack
   ```

2. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env # Add your Firebase & Gemini keys
   ```

3. **Setup Automation:**
   ```bash
   cd ../automation
   npm install
   # Add your service-account.json
   ```

4. **Run Locally:**
   ```bash
   cd ..
   npm run dev
   ```

## 🛡️ Security Rules

Deploy the included `firestore.rules` to your Firebase project to ensure only you can manage the data.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for the AI community.*
