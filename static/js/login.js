// ===============================
// Show / Hide Password
// ===============================

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

if (togglePassword && password) {

    togglePassword.addEventListener("click", function () {

        const type = password.getAttribute("type") === "password"
            ? "text"
            : "password";

        password.setAttribute("type", type);

        if (type === "password") {
            this.classList.remove("bi-eye-slash");
            this.classList.add("bi-eye");
        } else {
            this.classList.remove("bi-eye");
            this.classList.add("bi-eye-slash");
        }

    });

}

// ===============================
// Login Validation
// ===============================

const loginForm = document.querySelector("form");

if (loginForm) {

    loginForm.addEventListener("submit", function (e) {

        const email = document.querySelector('input[type="email"]').value.trim();
        const pass = password.value.trim();

        if (email === "" || pass === "") {

            e.preventDefault();   // Stop only if fields are empty

            alert("Please enter Email and Password.");

            return;
        }

        // If both fields are filled,
        // allow Flask to receive the form.
        // DO NOT use e.preventDefault() here.

    });

}