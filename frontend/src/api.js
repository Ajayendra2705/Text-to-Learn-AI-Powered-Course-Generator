// src/api.js
// fetch() wrapper that calls the backend with the user's Firebase ID token attached.
import { auth } from "./firebaseConfig";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export async function apiFetch(path, options = {}) {
  // On page load Firebase restores the session asynchronously; wait for it
  // so the first requests aren't sent without a token.
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
