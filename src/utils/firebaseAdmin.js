// src/utils/firebaseAdmin.js
import admin from "firebase-admin";

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Get Firestore instance
const db = admin.firestore();

export { admin, db };
