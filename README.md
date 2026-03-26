# Interactive 3D Geodesic Dome

An interactive web application for visualizing and annotating a 3D geodesic dome. Users can explore the dome structure, add personal notes to each face, and save their work to the cloud with Firebase authentication and storage.

## Live Demo

**Production URL:** https://geodesic-nov25.web.app

## Features

### Core Functionality
* **3D Geodesic Dome Visualization** - Interactive hemisphere rendering using Three.js
* **Face Interaction** - Double-click any triangular face to view or edit notes
* **Layer-Based Coloring** - Three distinct layers representing Foundations, Focus, and Fruition
* **Persistent Labels** - Face labels with smart visibility culling based on camera orientation
* **Initial Content** - Pre-populated with wellness and personal development concepts

### Mouse/Touch Controls
* **Rotate**: Click and drag (or swipe on touch devices).
* **Zoom**: Mouse wheel scroll or pinch gesture
* **Pan**: Right-click drag or two-finger drag

### Data Management
* **Cloud Storage** - Save multiple domes with custom names to Firebase Firestore
* **Authentication** - Passwordless email link sign-in
* **Sharing** - Generate shareable URLs for public domes
* **Multi-Device Access** - Access your saved domes from any device
* **Public/Private Settings** - Control who can view your domes
* **Read More Links** - Optionally add external resource URLs to any face

### UI Components
* **Modal Dialogs** - Clean interface for viewing and editing face data
* **Authentication Panel** - Sign in, save, load, and share domes
* **Legend Panel** - Visual guide to the dome's layer structure
* **First-Time Tooltip** - Optional welcome message for new users

## Tech Stack

* **TypeScript** - Type-safe application code
* **Three.js** - 3D rendering and camera controls
* **Firebase** - Authentication and Firestore database
* **Vite** - Development server and build tooling
* **CSS2DRenderer** - HTML label overlay system

## Prerequisites

* Node.js (v18.x or later)
* npm or yarn
* Firebase account (for authentication and storage features)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd geodesic
npm install
```

### 2. Configure Firebase

Follow the [Firebase Setup Guide](FIREBASE_SETUP.md) to:
- Create a Firebase project
- Enable Authentication (Email Link)
- Enable Firestore
- Get your Firebase configuration
- Create `src/firebase-config.ts` with your credentials
- **Customize the sign-in email template** (recommended for production deployments)

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

### 6. Deploy to Firebase Hosting

```bash
firebase deploy
```

See [Firebase Setup Guide](FIREBASE_SETUP.md) for detailed deployment instructions.

## How to Use

### Basic Interaction
1. **Rotate the dome** by clicking and dragging
2. **Zoom** using your mouse wheel
3. **Double-click any face** to open the edit dialog

### Managing Notes
1. **View** - See the face name and description
2. **Edit** - Modify name and description fields
3. **Read More** - If a URL is present, click "Read More..." to open external resources
4. **Save** - Click "Save" to persist your changes
5. **Reset** - Click "Reset to Default" to restore initial content
6. **Clear** - Click "Clear" to remove all data for that face

### Authentication & Cloud Features
1. **Sign In** - Click "Sign In" and enter your email
2. **Check Email** - Click the verification link sent to your email
3. **Save Dome** - Name your dome and choose public/private setting
4. **Load Dome** - Browse and select from your saved domes
5. **Share** - Copy the share URL to send to others
6. **Sign Out** - Click "Sign Out" when finished

### URL Sharing
Share a dome by sending its URL: `https://geodesic-nov25.web.app/?dome=<guid>`
- **Public domes** load for anyone with the link
- **Private domes** require authentication by the owner

## Project Structure

```
geodesic/
├── src/
│   ├── main.ts              # Main application entry point
│   ├── ui.ts                # Modal UI and face data types
│   ├── auth-ui.ts           # Authentication UI components
│   ├── styles.css           # Application styles
│   ├── firebase-config.ts   # Firebase configuration (gitignored)
│   ├── methods/             # Geodesic dome generation algorithms
│   │   ├── method1.ts       # True 2V geodesic
│   │   ├── method12.ts      # Interactive step-by-step (default)
│   │   └── types.ts         # Shared type definitions
│   └── services/
│       ├── auth.ts          # Firebase authentication
│       └── dome-storage.ts  # Firestore CRUD operations
├── public/
│   └── initial-data.json    # Default face content
├── index.html               # Main HTML template
├── README.md                # This file
├── CLAUDE.md                # AI assistant architecture guide
└── FIREBASE_SETUP.md        # Deployment guide
```

## Data Structure

### Face Data
Each face can store:
```typescript
{
  name?: string;           // Face label/title
  description?: string;    // Detailed notes
  readMoreUrl?: string;    // External resource URL
}
```

### Firestore Dome Document
```javascript
{
  id: string,              // Unique GUID
  name: string,            // User-provided dome name
  ownerEmail: string,      // Owner's email address
  ownerId: string,         // Firebase user ID
  faceData: {              // Map of face index to data
    "0": { name: "...", description: "...", readMoreUrl: "..." },
    "1": { ... }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isPublic: boolean        // Public sharing enabled
}
```

## Development Features

### Debug Mode
Add `?debug=true` to the URL to enable:
- Method selector (12 different dome generation algorithms)
- Step-by-step construction controls
- Angle adjustment sliders
- Face numbering overlay
- Debug info panel

Example: http://localhost:5173/?debug=true

### Multiple Dome Methods
The app supports 12 different geodesic dome generation methods:
- **Method 1**: True 2V geodesic using icosahedron subdivision
- **Method 2-11**: Various experimental approaches
- **Method 12**: Interactive step-by-step construction (default)

Only Method 12 is shown in production mode.

## Storage & Persistence

### Cloud Storage (Firebase)
- Domes saved to Firestore database
- Accessible from any device after sign-in
- Full sharing capabilities
- Multi-dome support per user

### Local Storage (Fallback)
- Auto-saves temp changes for unauthenticated users
- Initial face data loaded from `public/initial-data.json`
- Method selection preference
- First-time tooltip dismissal

## Browser Compatibility

Tested and working in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires WebGL support for 3D rendering.

## Known Issues & Limitations

- Face indexing uses Three.js BufferGeometry triangle indices
- Loading a shared dome replaces current unsaved work
- Email link authentication requires email access during sign-in
- Large domes (>100 annotated faces) may impact performance

## TODO

- [ ] Fix TOP label duplication issue when toggling auto-rotate (CSS2DRenderer orphaned DOM elements)

## Contributing

This is a personal project, but feedback and suggestions are welcome.

## License

[Add your license here]

## Acknowledgments

Built with:
- [Three.js](https://threejs.org/) - 3D graphics library
- [Firebase](https://firebase.google.com/) - Authentication and database
- [Vite](https://vitejs.dev/) - Build tool and dev server
