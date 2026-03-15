import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPk7jJRrYGOwH62VjjPbA0lvvXdxNWoFE",
  authDomain: "primereport-438c3.firebaseapp.com",
  projectId: "primereport-438c3",
  storageBucket: "primereport-438c3.firebasestorage.app",
  messagingSenderId: "24993070033",
  appId: "1:24993070033:web:23244f59192b963a803ef0",
  measurementId: "G-BDEGZ7PLHH"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);