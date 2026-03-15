import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_EMAILS = [
    "admin@primereport.com",
    "sivashankar96189@gmail.com"
];

onAuthStateChanged(auth, async (user) => {
    const isLoginPage = window.location.pathname.includes("login.html");
    
    if (!user) {
        if (!isLoginPage) {
            window.location.href = "login.html";
        }
    } else {
        // User logged in - check whitelist
        if (!ADMIN_EMAILS.includes(user.email)) {
            console.error("Unauthorized access attempt:", user.email);
            localStorage.removeItem("adminLoggedIn");
            localStorage.removeItem("adminToken");
            await signOut(auth);
            window.location.href = "login.html?error=unauthorized";
            return;
        }

        if (isLoginPage) {
            window.location.href = "index.html";
        }
    }
});