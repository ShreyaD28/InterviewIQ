import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/** Strip wrapping quotes from .env values (Vite sometimes preserves them). */
function stripQuotes(value) {
  if (typeof value !== "string") return "";
  return value.replace(/^["']|["']$/g, "").trim();
}

const firebaseConfig = {
  apiKey: stripQuotes(
    import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_APIKEY
  ),
  authDomain: stripQuotes(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: stripQuotes(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: stripQuotes(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: stripQuotes(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: stripQuotes(import.meta.env.VITE_FIREBASE_APP_ID),
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.error(
    "[Firebase] Missing or incomplete VITE_FIREBASE_* variables. In Firebase Console → Project settings → Your apps, copy the full `firebaseConfig` object into client/.env (all keys must be from the same web app)."
  );
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider };
