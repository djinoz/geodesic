// Firebase Authentication Service
// Handles email verification and user authentication
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { auth } from '../firebase-config';
import { signInWithEmailLink, sendSignInLinkToEmail, isSignInWithEmailLink, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
// Email verification settings
const actionCodeSettings = {
    // URL you want to redirect back to after email verification
    url: window.location.origin,
    handleCodeInApp: true,
};
// Send sign-in link to email
export function sendVerificationEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield sendSignInLinkToEmail(auth, email, actionCodeSettings);
            // Save the email locally so we can complete sign-in after redirect
            window.localStorage.setItem('emailForSignIn', email);
            return { success: true };
        }
        catch (error) {
            console.error('Error sending verification email:', error);
            return {
                success: false,
                error: error.message || 'Failed to send verification email'
            };
        }
    });
}
// Complete sign-in after user clicks email link
export function completeSignIn(emailLink) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const result = yield signInWithEmailLink(auth, email, emailLink);
            // Clear the email from storage
            window.localStorage.removeItem('emailForSignIn');
            return { success: true, user: result.user };
        }
        catch (error) {
            console.error('Error completing sign-in:', error);
            return {
                success: false,
                error: error.message || 'Failed to complete sign-in'
            };
        }
    });
}
// Sign out
export function signOut() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield firebaseSignOut(auth);
        }
        catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    });
}
// Listen to auth state changes
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}
// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}
// Check if user is authenticated
export function isAuthenticated() {
    return auth.currentUser !== null;
}
