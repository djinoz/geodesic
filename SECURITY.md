# Security Notes

## Firebase API Key in Repository (GitHub Alert)

If you received a GitHub secret scanning alert about the Firebase API key in `src/firebase-config.ts`, **this is a false positive and safe to dismiss**.

### Why Firebase Web API Keys Are Safe to Expose

Firebase API keys for web applications are **not secret credentials**. They are:

1. **Public by design**: Every user who visits your web app receives the API key in the JavaScript bundle
2. **Client identifiers**: They identify which Firebase project to connect to, nothing more
3. **Not authentication**: They don't grant access to your data or services

### How Firebase Security Works

Firebase security is **not** enforced by keeping API keys secret. Instead, it's enforced through:

1. **Firestore Security Rules** (`firestore.rules`) - Controls who can read/write database data
2. **Firebase Authentication** - Verifies user identity
3. **Authorized Domains** - Restricts which domains can use Firebase Auth

Your actual security comes from the rules in `firestore.rules`, which we've configured to:
- Prevent ownership transfer attacks
- Validate data schemas
- Enforce user-based access control

### What You Should Do

1. **Dismiss the GitHub alert** - Go to https://github.com/djinoz/geodesic/security/secret-scanning/1 and dismiss it
2. **Keep your security rules tight** - The `firestore.rules` file is your real security layer
3. **Never commit these** (already in .gitignore):
   - Service account keys (`.json` files from Firebase Console > Service Accounts)
   - Database secrets or admin SDK credentials
   - Environment variables with sensitive data

### References

- [Firebase Documentation: API Keys for Firebase are different](https://firebase.google.com/docs/projects/api-keys)
- [Firebase Blog: Using Firebase API Keys](https://firebase.blog/posts/2017/03/when-to-restrict-api-keys)

### Current Security Status

✅ Firestore security rules configured with ownership protection
✅ Schema validation enabled
✅ User authentication required for writes
✅ Public dome reads restricted to `isPublic: true` only
✅ Email/password authentication enabled
✅ Authorized domains configured

## Reporting Security Issues

If you discover a security vulnerability in this application, please open a GitHub issue or contact the repository owner directly.
