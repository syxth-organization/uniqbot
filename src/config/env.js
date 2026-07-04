const fs = require("node:fs");
const path = require("node:path");

function hasFirebaseJson() {
  return Boolean(process.env.FIREBASE_KEY && process.env.FIREBASE_KEY.trim().startsWith("{"));
}

function hasFirebaseBase64() {
  return Boolean(process.env.FIREBASE_KEY_BASE64);
}

function hasFirebaseIndividualFields() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_KEY)
  );
}

function hasLocalServiceAccountFile() {
  return fs.existsSync(path.join(process.cwd(), "serviceAccountKey.json"));
}

function validateEnv() {
  const missing = [];

  if (!process.env.DISCORD_TOKEN) missing.push("DISCORD_TOKEN");

  if (
    !hasFirebaseJson() &&
    !hasFirebaseBase64() &&
    !hasFirebaseIndividualFields() &&
    !hasLocalServiceAccountFile()
  ) {
    missing.push(
      "Firebase credentials: use FIREBASE_KEY as full JSON, FIREBASE_KEY_BASE64, FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or local serviceAccountKey.json"
    );
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}

function getOwnerId() {
  return process.env.OWNER_ID || null;
}

function getEnvChannelId(name) {
  return process.env[name] || null;
}

module.exports = {
  validateEnv,
  getOwnerId,
  getEnvChannelId
};
