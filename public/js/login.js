import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const errorMsg = document.getElementById("error-msg");

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.loginAdmin();
        });
    }

    window.loginAdmin = async function() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please provide both email and password.");
            return;
        }

        try {
            // Whitelist check
            const ADMIN_EMAILS = ["admin@primereport.com", "sivashankar96189@gmail.com"];
            if (!ADMIN_EMAILS.includes(email)) {
                errorMsg.style.display = "block";
                errorMsg.textContent = "Unauthorized: Only admin accounts can access this portal.";
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminToken", token);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Login failed:", error.code, error.message);
            errorMsg.style.display = "block";
            errorMsg.textContent = "Invalid login credentials. Please try again.";
        }
    };
});