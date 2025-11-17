# Firebase Setup Guide

This guide will walk you through setting up Firebase Authentication and Firestore for the Geodesic Dome project.

## Step 1: Get Your Firebase Configuration

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/u/0/project/geodesic-nov25/settings/general

2. **Add a Web App (if not already done)**
   - Scroll down to "Your apps" section
   - Click the **</>** (Web) icon to add a new web app
   - Give it a name (e.g., "Geodesic Dome Web")
   - Click "Register app"

3. **Copy the Firebase Config**
   - You'll see a `firebaseConfig` object that looks like this:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "geodesic-nov25.firebaseapp.com",
     projectId: "geodesic-nov25",
     storageBucket: "geodesic-nov25.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc..."
   };
   ```

4. **Update `src/firebase-config.ts`**
   - Open `src/firebase-config.ts`
   - Replace the placeholder values with your actual Firebase config
   - Save the file

## Step 2: Enable Firebase Authentication

1. **Go to Authentication**
   - In Firebase Console, click "Authentication" in the left sidebar
   - Click "Get started" if you haven't enabled Authentication

2. **Enable Email Link Sign-in**
   - Click on the "Sign-in method" tab
   - Click on "Email/Password"
   - Enable "Email link (passwordless sign-in)"
   - Click "Save"

3. **Add Authorized Domain**
   - Still in "Sign-in method" tab
   - Scroll down to "Authorized domains"
   - Make sure `localhost` is in the list (it should be by default)
   - When you deploy, add your production domain here

## Step 3: Enable Cloud Firestore

1. **Go to Firestore Database**
   - In Firebase Console, click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Choose Starting Mode**
   - Select **"Start in test mode"** for now (we'll add security rules later)
   - Click "Next"

3. **Choose Location**
   - Select a Cloud Firestore location close to you or your users
   - Click "Enable"

## Step 4: Set Up Firestore Security Rules

Once Firestore is created, we need to secure it properly.

1. **Go to Rules Tab**
   - In Firestore Database, click the "Rules" tab

2. **Replace the Rules**
   Copy and paste these security rules:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Dome collection rules
       match /domes/{domeId} {
         // Anyone can read public domes
         allow read: if resource.data.isPublic == true;

         // Authenticated users can read their own domes (public or private)
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

3. **Publish the Rules**
   - Click "Publish"

## Step 5: Test the Setup

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Open the App**
   - Navigate to http://localhost:5173

3. **Test Sign-in**
   - Click "Sign In" button
   - Enter your email
   - Check your email for the sign-in link
   - Click the link to complete sign-in

4. **Test Saving a Dome**
   - Modify some face data by double-clicking faces
   - Click "Save Dome"
   - Enter a name and save
   - The dome should be saved to Firestore

5. **Test Loading a Dome**
   - Click "Load Dome"
   - You should see your saved dome in the list
   - Click it to load

6. **Test Sharing**
   - Save a dome with "Make shareable" checked
   - Copy the share URL
   - Open it in an incognito window
   - The dome should load

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Make sure your domain is added to Firebase Console > Authentication > Settings > Authorized domains

### "Missing or insufficient permissions" when saving/loading
- Check that Firestore security rules are properly configured (Step 4)
- Make sure you're signed in

### Email link not working
- Check spam folder
- Make sure Email/Password provider is enabled in Firebase Console
- Make sure "Email link (passwordless sign-in)" is specifically enabled

### Firebase not initializing
- Make sure you've updated `src/firebase-config.ts` with your actual config values
- Check browser console for errors
- Make sure all Firebase services (Auth, Firestore) are enabled in Firebase Console

## Next Steps

Once everything is working:

1. **Add Production Domain**
   - When you deploy, add your production domain to Firebase Console > Authentication > Authorized domains

2. **Review Security Rules**
   - The current rules allow test/production use
   - Consider adding rate limiting or additional validation as needed

3. **Monitor Usage**
   - Check Firebase Console > Usage tab to monitor quotas
   - Firebase free tier is generous but monitor if you expect heavy traffic

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check Firebase Console > Project settings > Service accounts for any service issues
3. Verify all steps above are completed

## Security Note

**IMPORTANT**: The file `src/firebase-config.ts` is already added to `.gitignore` to prevent committing your Firebase credentials to Git. Never commit this file with real credentials to a public repository.

For production deployments, consider using environment variables instead of hardcoding the config.
