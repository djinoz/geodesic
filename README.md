# Interactive 3D Geodesic Dome

This web application displays an interactive 3D geodesic dome. Users can rotate the dome, zoom, and double-click on its faces to add or view notes associated with each face.

## Features

* 3D Geodesic Dome (Hemisphere) rendering using Three.js.
* Mouse/Touch Controls:
    * **Rotate**: Drag with the mouse (left-click) or swipe on a touch device.
    * **Zoom**: Scroll with the mouse wheel or pinch on a touch device.
    * **Pan**: Drag with the right mouse button or two-finger drag (if enabled and not conflicting with rotation).
* **Face Interaction**: Double-click on any face of the dome.
* **Text Notes**:
    * On each triangular face there is the potential to display the note associated with that face. 
    * A modal popup appears upon double-clicking a face.
    * View existing notes for the selected face.
    * Add new notes or edit existing ones.
    * Clear notes for a face.
* Notes are stored in the browser's session (data will be lost on full page reload if not persisted further, e.g., to localStorage or a backend).

## Tech Stack

* TypeScript
* Three.js for 3D rendering and interactions
* Vite for development server and build tooling
* HTML & CSS for structure and styling

## Prerequisites

* Node.js (v18.x or later recommended)
* npm (usually comes with Node.js) or yarn

## Setup and Running Locally

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd geodesic-dome-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```

3.  **Run the Development Server:**
    This command will start a local development server, and the application will typically open automatically in your default web browser. It supports Hot Module Replacement (HMR) for a fast development experience.
    ```bash
    npm run dev
    ```
    or
    ```bash
    yarn dev
    ```
    Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

4.  **Build for Production:**
    This command will compile the TypeScript code and bundle the application for production. The output will be in the `dist` folder.
    ```bash
    npm run build
    ```
    or
    ```bash
    yarn build
    ```

5.  **Preview Production Build:**
    To test the production build locally, you can run:
    ```bash
    npm run preview
    ```
    or
    ```bash
    yarn preview
    ```
    This will serve the `dist` folder.

## Deployment to Vercel

This project is configured for easy deployment to [Vercel](https://vercel.com/).

### Steps to Deploy:

1.  **Sign up on Vercel**: If you don't have an account, sign up at [vercel.com](https://vercel.com/) using your GitHub, GitLab, or Bitbucket account.

2.  **Create a New Project**:
    *   From your Vercel dashboard, click "Add New..." and then "Project".
    *   Import the Git repository for this project.

3.  **Configure the Project**:
    *   Vercel will automatically detect that this is a Vite project and use the settings from `vercel.json`.
    *   The build command (`npm run build`) and the output directory (`dist`) are already configured.
    *   You can add any environment variables if needed (though none are required for this project).

4.  **Deploy**:
    *   Click the "Deploy" button.
    *   Vercel will build and deploy your project. You'll get a unique URL for your live site (e.g., `your-project-name.vercel.app`).

### Automatic Deployments (CI/CD)

Once linked, Vercel will automatically redeploy your project on every push to the main branch. It will also create unique preview deployments for every pull request, allowing you to test changes before merging them.

## How to Use

1.  Once the application is running, you'll see the geodesic dome.
2.  **Rotate**: Click and drag the mouse on the dome.
3.  **Zoom**: Use your mouse scroll wheel.
4.  **Interact with Faces**: Double-click on any triangular face of the dome.
5.  **Manage Notes**:
    * A dialog box will appear.
    * If there's an existing note for that face, it will be displayed.
    * You can type new text into the textarea or modify existing text.
    * Click "Save Note" to save your changes for the current session.
    * Click "Clear Note" to remove any notes for that face.
    * Click the "×" button or outside the dialog to close it.

## Notes on Face Indexing

The `faceIndex` used for storing notes corresponds to the index of the face in the Three.js geometry's `faces` array (for `BufferGeometry`, this is derived from the `index` attribute, usually `triangleIndex = attribute.array[i] / 3`). This index is stable for a given geometry configuration.
