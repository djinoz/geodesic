// Firebase Analytics Service
// Tracks user interactions and events across the application

import { getAnalytics, logEvent, setUserId, setUserProperties, isSupported } from 'firebase/analytics';
import app from '../firebase-config';

// Check if debug mode is enabled via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === 'true';

// Initialize analytics with debug mode configuration
const analytics = getAnalytics(app);

// Enable debug mode for Firebase Analytics DebugView
if (debugMode) {
    // Set debug mode on all events
    (window as any)['GA_DEBUG_MODE'] = true;

    // Wait for gtag to be available, then configure it
    const configureGtag = () => {
        if (typeof (window as any)['gtag'] === 'function') {
            (window as any)['gtag']('config', 'G-VQ6FRTWKBK', {
                'debug_mode': true
            });
            console.log('🔍 Firebase Analytics DEBUG MODE enabled - events will appear in DebugView');
            console.log('📊 View events at: https://console.firebase.google.com/project/geodesic-nov25/analytics/debugview');
        } else {
            // gtag not available yet, try again shortly
            setTimeout(configureGtag, 100);
        }
    };

    configureGtag();
}

// Generate or retrieve anonymous user ID for non-authenticated users
function getAnonymousUserId(): string {
    const ANONYMOUS_ID_KEY = 'geodesic-anonymous-user-id';
    let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);

    if (!anonymousId) {
        // Generate a unique ID based on timestamp and random value
        anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
    }

    return anonymousId;
}

// Helper to add debug_mode parameter if in debug mode
function getEventParams(params: any): any {
    if (debugMode) {
        return { ...params, debug_mode: true };
    }
    return params;
}

// Set user ID for analytics (works for both authenticated and anonymous users)
export function setAnalyticsUserId(userId: string | null): void {
    try {
        if (userId) {
            setUserId(analytics, userId);
            setUserProperties(analytics, { user_type: 'authenticated' });
            console.log(`Analytics user ID set: ${userId} (authenticated)`);
        } else {
            // Use anonymous ID for non-authenticated users
            const anonId = getAnonymousUserId();
            setUserId(analytics, anonId);
            setUserProperties(analytics, { user_type: 'anonymous' });
            console.log(`Analytics user ID set: ${anonId} (anonymous)`);
        }
    } catch (error) {
        console.error('Error setting analytics user ID:', error);
    }
}

// Track dome rotation events
export function trackRotationToggle(isRotating: boolean, userId: string | null): void {
    try {
        logEvent(analytics, isRotating ? 'rotation_started' : 'rotation_stopped', getEventParams({
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        }));
        console.log(`Analytics: Rotation ${isRotating ? 'started' : 'stopped'}`);
    } catch (error) {
        console.error('Error tracking rotation toggle:', error);
    }
}

// Track drag events on dome
export function trackDomeDrag(userId: string | null): void {
    try {
        logEvent(analytics, 'dome_dragged', {
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log('Analytics: Dome dragged');
    } catch (error) {
        console.error('Error tracking dome drag:', error);
    }
}

// Track face double-click/selection
export function trackFaceSelected(faceIndex: number, userId: string | null): void {
    try {
        logEvent(analytics, 'face_selected', {
            face_index: faceIndex,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Face ${faceIndex} selected`);
    } catch (error) {
        console.error('Error tracking face selection:', error);
    }
}

// Track "Read more" link clicks
export function trackReadMoreClick(faceIndex: number, url: string, userId: string | null): void {
    try {
        logEvent(analytics, 'read_more_clicked', {
            face_index: faceIndex,
            url: url,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Read more clicked for face ${faceIndex}`);
    } catch (error) {
        console.error('Error tracking read more click:', error);
    }
}

// Track dome save events
// Track dome save events
export function trackDomeSave(domeId: string, domeName: string, faceCount: number, isPublic: boolean, userId: string | null, saveType: 'overwrite' | 'copy' | 'fork' | 'create' = 'create'): void {
    try {
        logEvent(analytics, 'dome_saved', {
            dome_id: domeId,
            dome_name: domeName,
            face_count: faceCount,
            is_public: isPublic,
            save_type: saveType,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Dome saved - ${domeName} (${faceCount} faces) [Type: ${saveType}]`);
    } catch (error) {
        console.error('Error tracking dome save:', error);
    }
}

// Track save action button clicks (Save vs Save as Copy)
export function trackSaveActionClick(action: 'save' | 'save_as_copy', userId: string | null): void {
    try {
        logEvent(analytics, 'save_action_clicked', {
            action: action,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Save action clicked - ${action}`);
    } catch (error) {
        console.error('Error tracking save action click:', error);
    }
}

// Track dome load events
export function trackDomeLoad(domeId: string, domeName: string, userId: string | null): void {
    try {
        logEvent(analytics, 'dome_loaded', {
            dome_id: domeId,
            dome_name: domeName,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Dome loaded - ${domeName}`);
    } catch (error) {
        console.error('Error tracking dome load:', error);
    }
}

// Track authentication events
export function trackSignInAttempt(email: string): void {
    try {
        logEvent(analytics, 'sign_in_attempt', getEventParams({
            email: email,
            user_id: getAnonymousUserId(), // Use anonymous ID for attempt
            timestamp: Date.now()
        }));
        console.log('Analytics: Sign-in attempt');
    } catch (error) {
        console.error('Error tracking sign-in attempt:', error);
    }
}

export function trackSignInSuccess(userId: string, email: string): void {
    try {
        // Set the authenticated user ID
        setAnalyticsUserId(userId);

        logEvent(analytics, 'sign_in_success', getEventParams({
            user_id: userId,
            email: email,
            timestamp: Date.now()
        }));
        console.log('Analytics: Sign-in successful');
    } catch (error) {
        console.error('Error tracking sign-in success:', error);
    }
}

export function trackSignOut(userId: string): void {
    try {
        logEvent(analytics, 'sign_out', {
            user_id: userId,
            timestamp: Date.now()
        });
        console.log('Analytics: Sign-out');

        // Reset to anonymous user
        setAnalyticsUserId(null);
    } catch (error) {
        console.error('Error tracking sign-out:', error);
    }
}

// Track face note edit/save
export function trackFaceNoteSave(faceIndex: number, hasName: boolean, hasDescription: boolean, hasUrl: boolean, userId: string | null): void {
    try {
        logEvent(analytics, 'face_note_saved', {
            face_index: faceIndex,
            has_name: hasName,
            has_description: hasDescription,
            has_url: hasUrl,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Face note saved for face ${faceIndex}`);
    } catch (error) {
        console.error('Error tracking face note save:', error);
    }
}

// Track modal open/close
export function trackModalOpen(faceIndex: number, userId: string | null): void {
    try {
        logEvent(analytics, 'modal_opened', {
            face_index: faceIndex,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Modal opened for face ${faceIndex}`);
    } catch (error) {
        console.error('Error tracking modal open:', error);
    }
}

// Track page views and session start
export function trackPageView(userId: string | null): void {
    try {
        logEvent(analytics, 'page_view', getEventParams({
            page_title: document.title,
            page_location: window.location.href,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        }));
        console.log('Analytics: Page view tracked');
    } catch (error) {
        console.error('Error tracking page view:', error);
    }
}

// Initialize analytics on app start
export function initializeAnalytics(userId: string | null = null): void {
    try {
        // Set user ID (authenticated or anonymous)
        setAnalyticsUserId(userId);

        // Track initial page view
        trackPageView(userId);

        console.log('Analytics initialized');
    } catch (error) {
        console.error('Error initializing analytics:', error);
    }
}

// Track UI interactions
export function trackButtonClick(buttonName: string, userId: string | null): void {
    try {
        logEvent(analytics, 'button_clicked', {
            button_name: buttonName,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Button clicked - ${buttonName}`);
    } catch (error) {
        console.error('Error tracking button click:', error);
    }
}

// Track modal actions
export function trackModalAction(action: string, faceIndex: number | null, userId: string | null): void {
    try {
        logEvent(analytics, 'modal_action', {
            action: action,
            face_index: faceIndex,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Modal action - ${action}`);
    } catch (error) {
        console.error('Error tracking modal action:', error);
    }
}

// Track tooltip interactions
export function trackTooltipDismissed(dontShowAgain: boolean, userId: string | null): void {
    try {
        logEvent(analytics, 'tooltip_dismissed', {
            dont_show_again: dontShowAgain,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Tooltip dismissed (don't show again: ${dontShowAgain})`);
    } catch (error) {
        console.error('Error tracking tooltip dismiss:', error);
    }
}

// Track dome deletions
export function trackDomeDelete(domeId: string, domeName: string, userId: string | null): void {
    try {
        logEvent(analytics, 'dome_deleted', {
            dome_id: domeId,
            dome_name: domeName,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Dome deleted - ${domeName}`);
    } catch (error) {
        console.error('Error tracking dome delete:', error);
    }
}

// Track share URL copy
export function trackShareUrlCopied(domeId: string, userId: string | null): void {
    try {
        logEvent(analytics, 'share_url_copied', {
            dome_id: domeId,
            user_id: userId || getAnonymousUserId(),
            timestamp: Date.now()
        });
        console.log(`Analytics: Share URL copied for dome ${domeId}`);
    } catch (error) {
        console.error('Error tracking share URL copy:', error);
    }
}
