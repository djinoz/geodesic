// Firebase Authentication Service
// Handles email verification and user authentication

import {
    auth
} from '../firebase-config';
import {
    signInWithEmailLink,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

// Email verification settings
// NOTE: The email link will automatically use your deployment's URL (window.location.origin)
// This works for custom domains and any Firebase hosting URL.
//
// IMPORTANT: Customize the email template in Firebase Console for production:
// 1. Go to Firebase Console > Authentication > Templates
// 2. Edit "Email link sign-in" template (NOT "Email address verification")
// 3. Update sender name and subject (email body cannot be customized - Firebase limitation)
// See FIREBASE_SETUP.md for detailed instructions
const actionCodeSettings = {
    // URL you want to redirect back to after email verification
    url: window.location.origin,
    handleCodeInApp: true,
};

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

// Send sign-in link to email
export async function sendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);

        // Save the email locally so we can complete sign-in after redirect
        window.localStorage.setItem('emailForSignIn', email);

        return { success: true };
    } catch (error: any) {
        console.error('Error sending verification email:', error);
        return {
            success: false,
            error: error.message || 'Failed to send verification email'
        };
    }
}

// Complete sign-in after user clicks email link
export async function completeSignIn(emailLink: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
        // Confirm the link is a sign-in with email link
        if (!isSignInWithEmailLink(auth, emailLink)) {
            return { success: false, error: 'Invalid sign-in link' };
        }

        // Get the email from localStorage
        let email = window.localStorage.getItem('emailForSignIn');

        if (!email) {
            // If email is not in localStorage, ask user to provide it
            email = window.prompt('Please provide your email for confirmation');
        }

        if (!email) {
            return { success: false, error: 'Email is required' };
        }

        // Complete sign-in
        const result = await signInWithEmailLink(auth, email, emailLink);

        // Clear the email from storage
        window.localStorage.removeItem('emailForSignIn');

        return { success: true, user: result.user };
    } catch (error: any) {
        console.error('Error completing sign-in:', error);
        return {
            success: false,
            error: error.message || 'Failed to complete sign-in'
        };
    }
}

// Sign out
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    return auth.currentUser !== null;
}
