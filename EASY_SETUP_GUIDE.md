# ShiftNote AU — Easy Installation & Deployment Guide

This guide provides the simplest, zero-headache instructions to install, run, and deploy **ShiftNote AU**.

---

## ⚡ Method 1: The 1-Click Local Standalone App (Zero Setup)

Everything is pre-automated. You do not need to configure any databases or API keys to start testing.

### For Windows:
1. **First Time Setup**: Double-click **`setup.bat`**.
   - It automatically verifies Node.js, sets up default configuration, installs dependencies, and compiles the app.
2. **Daily Use**: Double-click **`run.bat`**.
   - Starts the server and automatically opens your browser directly to the app.

### For macOS / Linux:
1. **First Time Setup**: Run `./setup.sh` in your terminal.
2. **Daily Use**: Run `./run.sh` or `npm run demo`.

---

## 📲 Method 2: Install as a Desktop or Mobile App (PWA)

ShiftNote AU is built with Progressive Web App (PWA) standards. It runs as a true standalone native application without browser URL bars or tabs.

### On Desktop (Windows / Mac / Chromebook):
1. Open the app in **Google Chrome** or **Microsoft Edge** (`http://localhost:3000` or your live URL).
2. Click the **"📲 Install App"** button at the top of the screen (or the install icon ⊞ on the right side of your browser address bar).
3. Click **Install**.
4. ShiftNote AU is now installed as a desktop application with its own icon on your Desktop and Start Menu!

### On Mobile (iPhone / iPad / Android):
- **iPhone / iPad (Safari)**:
  1. Open your link in Safari.
  2. Tap the **Share** button (square with arrow pointing up).
  3. Scroll down and tap **"Add to Home Screen"**.
  4. Tap **Add**. An app icon appears on your home screen.
- **Android (Chrome)**:
  1. Open your link in Chrome.
  2. Tap the three dots (⋮) in the top-right.
  3. Tap **"Install App"** or **"Add to Home screen"**.

---

## ☁️ Method 3: 1-Click Cloud Deployment to Vercel

To publish this app so thousands of users can access it from anywhere in the world on `https://your-domain.com`:

### Option A: The 1-Click Script
1. Double-click **`deploy-vercel.bat`**.
2. Follow the 3 prompts in your terminal:
   - Login to Vercel (opens browser once).
   - Set project name (press Enter for default).
   - Confirm deploy to production.
3. Your app is immediately live on a global Sydney edge URL (e.g. `https://shiftnote-au.vercel.app`).

### Option B: GitHub + Vercel Dashboard (Continuous Deployment)
1. Push this folder to your GitHub account (`git push -u origin main`).
2. Go to [vercel.com](https://vercel.com) &rarr; **Add New Project** &rarr; select `shiftnote-au`.
3. Add your environment variables (from `.env.example`).
4. Click **Deploy**. Any future code updates you push to GitHub will automatically deploy in under 60 seconds.

---

## 🛠️ Summary of Scripts Included in This Package

| Script | Purpose |
| :--- | :--- |
| **`setup.bat`** | 1-Click automated Windows installer & builder |
| **`run.bat`** | 1-Click Windows standalone app runner & browser launcher |
| **`setup.sh`** | 1-Click macOS/Linux automated installer |
| **`run.sh`** | 1-Click macOS/Linux app runner |
| **`deploy-vercel.bat`** | 1-Click cloud deployment script |
| **`start-demo.bat`** | 1-Click interactive showcase & demo tour launcher |

