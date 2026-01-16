# Firebase Analytics Implementation

This document describes the comprehensive Firebase Analytics tracking implemented across the geodesic dome application.

## Overview

Firebase Analytics has been integrated to track user interactions throughout the application. The system tracks both **authenticated users** (logged in via Firebase Auth) and **anonymous users** (using a persistent anonymous ID stored in localStorage).

## Analytics Module

Location: `src/services/analytics.ts`

### Key Features

- **Anonymous User Tracking**: Automatically generates and persists a unique ID for non-authenticated users
- **User ID Tracking**: Tracks both authenticated (Firebase UID) and anonymous users
- **Consistent User Identification**: Maintains user identity across sessions using localStorage

## Tracked Events

### 1. Rotation Events
- **Event**: `rotation_started`, `rotation_stopped`
- **Trigger**: Auto-rotate checkbox toggle
- **Location**: `src/main.ts:1992-1997`
- **Data Captured**:
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 2. Dome Drag/Interaction
- **Event**: `dome_dragged`
- **Trigger**: OrbitControls camera movement (throttled to once per 5 seconds)
- **Location**: `src/main.ts:725-735`
- **Data Captured**:
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 3. Face Selection
- **Event**: `face_selected`
- **Trigger**: Double-click or double-tap on a dome face
- **Location**: `src/main.ts:1268-1270`
- **Data Captured**:
  - `face_index`: Index of the selected face
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 4. Modal Interactions
- **Event**: `modal_opened`
- **Trigger**: Face modal dialog opens
- **Location**: `src/ui.ts:163-165`
- **Data Captured**:
  - `face_index`: Index of the face being viewed/edited
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 5. Face Note Saves
- **Event**: `face_note_saved`
- **Trigger**: User saves notes for a face
- **Location**: `src/ui.ts:92-100`
- **Data Captured**:
  - `face_index`: Index of the face
  - `has_name`: Boolean indicating if a name was set
  - `has_description`: Boolean indicating if a description was set
  - `has_url`: Boolean indicating if a "Read more" URL was set
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 6. Read More Clicks
- **Event**: `read_more_clicked`
- **Trigger**: User clicks "Read more..." link in face modal
- **Location**: `src/ui.ts:217-221`
- **Data Captured**:
  - `face_index`: Index of the face
  - `url`: The URL that was clicked
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 7. Dome Save Events
- **Event**: `dome_saved`
- **Trigger**: User saves their dome to Firebase
- **Location**: `src/auth-ui.ts:362-363`
- **Data Captured**:
  - `dome_id`: Unique ID of the saved dome
  - `dome_name`: Name given to the dome
  - `face_count`: Number of faces with notes
  - `is_public`: Whether the dome is publicly shared
  - `user_id`: Authenticated UID (always authenticated for saves)
  - `timestamp`: Event time

### 8. Dome Load Events
- **Event**: `dome_loaded`
- **Trigger**: User loads a saved dome
- **Location**: `src/auth-ui.ts:639-641`
- **Data Captured**:
  - `dome_id`: Unique ID of the loaded dome
  - `dome_name`: Name of the dome
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

### 9. Authentication Events

#### Sign-in Attempt
- **Event**: `sign_in_attempt`
- **Trigger**: User requests sign-in link email
- **Location**: `src/auth-ui.ts:262`
- **Data Captured**:
  - `email`: Email address used for sign-in
  - `user_id`: Anonymous ID (before authentication)
  - `timestamp`: Event time

#### Sign-in Success
- **Event**: `sign_in_success`
- **Trigger**: User successfully completes email link authentication
- **Location**: `src/auth-ui.ts:214`
- **Data Captured**:
  - `user_id`: Authenticated UID
  - `email`: User's email address
  - `timestamp`: Event time

#### Sign-out
- **Event**: `sign_out`
- **Trigger**: User clicks logout button
- **Location**: `src/auth-ui.ts:691`
- **Data Captured**:
  - `user_id`: Authenticated UID (before sign-out)
  - `timestamp`: Event time

### 10. Page View
- **Event**: `page_view`
- **Trigger**: Application initialization
- **Location**: `src/main.ts:1946` (via `initializeAnalytics`)
- **Data Captured**:
  - `page_title`: Document title
  - `page_location`: Current URL
  - `user_id`: Authenticated UID or anonymous ID
  - `timestamp`: Event time

## User Tracking Strategy

### Anonymous Users
- A unique ID is generated on first visit: `anon-{timestamp}-{random}`
- Stored in localStorage key: `geodesic-anonymous-user-id`
- Persists across sessions until cleared
- User property set: `user_type: 'anonymous'`

### Authenticated Users
- Uses Firebase Authentication UID
- User property set: `user_type: 'authenticated'`
- Automatically transitions from anonymous to authenticated on sign-in
- Returns to anonymous tracking on sign-out

## Implementation Details

### Analytics Initialization
Analytics is initialized early in the app startup process:
```typescript
// src/main.ts, line 1944-1946
const user = getCurrentUser();
initializeAnalytics(user?.uid || null);
```

### User ID Management
User IDs are automatically updated on authentication state changes:
```typescript
// src/auth-ui.ts, line 56-65
onAuthStateChange((user) => {
    updateAuthUI(user);
    if (user) {
        setAnalyticsUserId(user.uid);
    } else {
        setAnalyticsUserId(null); // Uses anonymous ID
    }
});
```

### Throttling
Some high-frequency events are throttled:
- **Drag events**: Maximum once per 5 seconds
- Prevents overwhelming analytics with repetitive data

## Viewing Analytics Data

Analytics data can be viewed in the Firebase Console:
1. Go to https://console.firebase.google.com/project/geodesic-nov25/analytics
2. Navigate to "Events" to see all tracked events
3. Use "User Properties" to filter by user type (anonymous vs authenticated)
4. Create custom reports to analyze user behavior patterns

### Important Notes About Analytics Delays

**Firebase Analytics has inherent delays before data appears in the console:**

- **Realtime Overview**: Can take **30 minutes to several hours** for events to appear
- **Events Dashboard**: Full event data typically appears within **24 hours**
- **DebugView**: For immediate testing, enable debug mode (see below)

### Testing Analytics in Real-Time

To see analytics events immediately during development, use **Firebase Analytics DebugView**:

1. **Enable Debug Mode** by adding `?debug=true` to your URL:
   ```
   https://geodesic-nov25.web.app/?debug=true
   ```

   **Note**: This parameter only enables Firebase Analytics debugging and does NOT show old rendering algorithms or the method selector.

2. **View Debug Events** in Firebase Console:
   - Go to: https://console.firebase.google.com/project/geodesic-nov25/analytics/debugview
   - Events will appear in real-time (within seconds)

3. **Console Logging**:
   - All analytics events are logged to the browser console with messages like:
     - `Analytics: Rotation started`
     - `Analytics: Face 5 selected`
     - `Analytics user ID set: {userId}`
   - These console logs confirm events are being sent, even if they don't appear in Firebase immediately

## URL Parameters

The application supports two URL parameters for different purposes:

### `?debug=true` - Analytics Debug Mode
- **Purpose**: Enables Firebase Analytics DebugView for real-time event tracking
- **What it does**:
  - Events appear in Firebase DebugView console within seconds
  - Shows detailed analytics logging in browser console
- **What it DOES NOT do**:
  - Does not show method selector
  - Does not show old rendering algorithms (Methods 1-12)
  - Does not show face numbers or geometry indices

### `?dev=true` - Developer Mode
- **Purpose**: Shows development tools and experimental features
- **What it does**:
  - Shows method selector dropdown
  - Enables all rendering algorithms (Methods 1-13)
  - Shows face numbers and geometry indices on hover
  - Exposes `geodesicData` to window for debugging
- **What it DOES NOT do**:
  - Does not enable Firebase Analytics DebugView
  - Regular analytics still works, but won't appear in real-time

### Using Both Parameters
You can combine both for full debugging capabilities:
```
https://geodesic-nov25.web.app/?debug=true&dev=true
```

This gives you:
- Real-time analytics in DebugView (`?debug=true`)
- Full development tools (`?dev=true`)

### Why the Delay?

Firebase Analytics batches and processes events for efficiency and accuracy:
- Events are queued locally and sent in batches
- Server-side processing aggregates and validates data
- This ensures data accuracy and prevents duplicate/invalid events
- The delay is normal and expected behavior

## Privacy Considerations

- Anonymous IDs are generated locally and don't contain personal information
- Email addresses are only tracked for authenticated users who explicitly sign in
- All event tracking respects Firebase Analytics' built-in privacy features
- No sensitive user content (face notes) is sent to analytics
