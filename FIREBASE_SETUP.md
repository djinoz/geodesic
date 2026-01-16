# Deploy Geodesic Dome to Firebase Hosting

This guide will get your app deployed to the public web in ~10 minutes.

## Quick Deploy Steps

### 1. Initialize Firebase Hosting

```bash
firebase login
firebase init hosting
```

When prompted:
- **"Please select an option:"** → Choose "Use an existing project"
- **"Select a default Firebase project:"** → Choose `geodesic-nov25`
- **"What do you want to use as your public directory?"** → Enter `dist`
- **"Configure as a single-page app (rewrite all urls to /index.html)?"** → Enter `y` (Yes)
  - This is required for your app to work correctly - it ensures all routes load your app
- **"Set up automatic builds and deploys with GitHub?"** → Enter `N` (No)
  - You'll deploy manually with `firebase deploy` command
- **"File dist/index.html already exists. Overwrite?"** → Enter `N` (No) - if this appears

### 2. Build Your App

```bash
npm run build
```

This compiles TypeScript and creates optimized production files in the `dist/` directory.

### 3. Deploy to Firebase

```bash
firebase deploy
```

Your app will be live at: **https://geodesic-nov25.web.app**

## Update Authorized Domains for Authentication

After deploying, you need to authorize your production domain:

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/u/0/project/geodesic-nov25/authentication/settings)
2. Click the **"Settings"** tab
3. Scroll down to **"Authorized domains"**
4. Click **"Add domain"**
5. Add: `geodesic-nov25.web.app`
6. Click **"Add"**

## Re-deploy After Changes

Whenever you make changes to your app:

```bash
npm run build
firebase deploy
```

## View Your Live App

After deployment completes, visit:
- **Primary URL:** https://geodesic-nov25.web.app
- **Alternative URL:** https://geodesic-nov25.firebaseapp.com

Both URLs point to the same app.

---

## Initial Firebase Setup (One-Time Only)

If this is your first time setting up Firebase services, follow these steps:

### Enable Firebase Authentication

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/u/0/project/geodesic-nov25/authentication)
2. Click **"Get started"** (if not already enabled)
3. Click **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Enable **"Email link (passwordless sign-in)"**
6. Click **"Save"**

### Customize Sign-In Email Template (Recommended)

By default, Firebase sends emails with your project name (e.g., "Sign in to geodesic-nov25"). For a better user experience:

1. Go to [Firebase Console - Authentication - Templates](https://console.firebase.google.com/project/geodesic-nov25/authentication/emails)
2. Find **"Email link sign-in"** template (NOT "Email address verification")
3. Click **"Edit template"** (pencil icon)
4. Customize what Firebase allows:
   - **Sender name:** Change from "geodesic-nov25" to your app name (e.g., "Geodesic Dome" or "My Dome App")
   - **Subject:** Update to something like "Sign in to [Your App Name]"
   - **Reply-to email:** Set a support email (optional)
5. Click **"Save"**

**Important Limitation:** Firebase does not allow editing the email body text for security reasons. The email content is controlled by Google/Firebase. Only the sender name and subject can be customized through the Console.

**Note for Custom Domains:** The email link automatically uses your deployment URL (`window.location.origin`), so it works with:
- Firebase Hosting URLs (geodesic-nov25.web.app)
- Custom domains (myapp.com)
- Development URLs (localhost:5173)

Make sure to add any custom domains to **Authorized domains** (Authentication > Settings > Authorized domains).

### Enable Cloud Firestore

1. Go to [Firebase Console - Firestore](https://console.firebase.google.com/u/0/project/geodesic-nov25/firestore)
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Click **"Next"**
5. Choose a location (e.g., `us-central1`)
6. Click **"Enable"**

### Set Firestore Security Rules

1. In Firestore, click the **"Rules"** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Dome collection rules
    match /domes/{domeId} {
      // Anyone can read public domes
      allow read: if resource.data.isPublic == true;

      // Authenticated users can read their own domes
      allow read: if request.auth != null &&
                     request.auth.uid == resource.data.ownerId;

      // Authenticated users can create domes
      allow create: if request.auth != null &&
                      request.auth.uid == request.resource.data.ownerId &&
                      request.resource.data.ownerEmail == request.auth.token.email;

      // Users can update their own domes
      allow update: if request.auth != null &&
                      request.auth.uid == resource.data.ownerId;

      // Users can delete their own domes
      allow delete: if request.auth != null &&
                      request.auth.uid == resource.data.ownerId;
    }
  }
}
```

3. Click **"Publish"**

### Configure Firebase in Your Code

1. Get your Firebase config from [Firebase Console - Project Settings](https://console.firebase.google.com/u/0/project/geodesic-nov25/settings/general)
2. Scroll to **"Your apps"** section
3. If you don't have a web app, click **</>** to add one
4. Copy the `firebaseConfig` object
5. Create `src/firebase-config.ts` with your config:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "geodesic-nov25.firebaseapp.com",
  projectId: "geodesic-nov25",
  storageBucket: "geodesic-nov25.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**IMPORTANT:** Never commit `src/firebase-config.ts` to a public repository. It's already in `.gitignore`.

---

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
→ Add your domain to Firebase Console > Authentication > Settings > Authorized domains

### "Missing or insufficient permissions"
→ Check Firestore security rules and ensure you're signed in

### Build fails
→ Run `npm install` and try building again

### Deploy fails
→ Make sure you're logged in: `firebase login`

### App doesn't update after deploy
→ Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

## Useful Commands

```bash
# View deployment history
firebase hosting:sites:list

# Check Firebase project info
firebase projects:list

# View hosting URL
firebase hosting:sites:get geodesic-nov25

# Deploy only hosting (skip functions, firestore, etc)
firebase deploy --only hosting
```

## Custom Domain (Optional)

To use your own domain (e.g., myapp.com):

1. Go to [Firebase Console - Hosting](https://console.firebase.google.com/u/0/project/geodesic-nov25/hosting)
2. Click **"Add custom domain"**
3. Follow the DNS configuration steps
4. Don't forget to add your custom domain to **Authorized domains** in Authentication settings
