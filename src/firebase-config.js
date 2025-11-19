// Firebase Configuration
//
// To get these values:
// 1. Go to https://console.firebase.google.com/u/0/project/geodesic-nov25/settings/general
// 2. Scroll down to "Your apps" section
// 3. Click "Add app" and select "Web" (</>) if you haven't already
// 4. Register the app and copy the firebaseConfig object
// 5. Replace the placeholder values below with your actual config values
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyDoAMNb-q6Lw-0nkXMcVG2mJRlYGFu7QHc",
    authDomain: "geodesic-nov25.firebaseapp.com",
    projectId: "geodesic-nov25",
    storageBucket: "geodesic-nov25.firebasestorage.app",
    messagingSenderId: "875418449198",
    appId: "1:875418449198:web:5367d4d18647be84c3b6bf",
    measurementId: "G-VQ6FRTWKBK"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
