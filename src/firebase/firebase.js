const fs = require("node:fs");
const path = require("node:path");
const admin = require("firebase-admin");

function normalizePrivateKey(privateKey) {
  return String(privateKey).replace(/\\n/g, "\n");
}

function buildServiceAccountFromIndividualFields() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_KEY;

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      "Firebase individual fields require FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: normalizePrivateKey(privateKey)
  };
}

function parseFirebaseKey() {
  if (process.env.FIREBASE_KEY_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_KEY_BASE64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);

    if (parsed.private_key) parsed.private_key = normalizePrivateKey(parsed.private_key);
    return parsed;
  }

  if (process.env.FIREBASE_KEY) {
    const rawKey = process.env.FIREBASE_KEY.trim();

    if (rawKey.startsWith("{")) {
      const parsed = JSON.parse(rawKey);
      if (parsed.private_key) parsed.private_key = normalizePrivateKey(parsed.private_key);
      return parsed;
    }

    if (rawKey.includes("BEGIN PRIVATE KEY")) {
      return buildServiceAccountFromIndividualFields();
    }
  }

  if (process.env.FIREBASE_PRIVATE_KEY) {
    return buildServiceAccountFromIndividualFields();
  }

  const localKeyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(localKeyPath)) {
    const parsed = require(localKeyPath);
    if (parsed.private_key) parsed.private_key = normalizePrivateKey(parsed.private_key);
    return parsed;
  }

  throw new Error("Firebase credentials were not found.");
}

function initFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(parseFirebaseKey())
    });
  }

  return admin.firestore();
}

module.exports = {
  initFirebase
};
