// ===============================
// Show / Hide Password
// ===============================

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", function () {

    const type = password.getAttribute("type") === "password"
        ? "text"
        : "password";

    password.setAttribute("type", type);

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");

});

// ===============================
// Confirm Password
// ===============================

const toggleConfirm = document.getElementById("toggleConfirm");
const confirmPassword = document.getElementById("confirmPassword");

toggleConfirm.addEventListener("click", function () {

    const type = confirmPassword.getAttribute("type") === "password"
        ? "text"
        : "password";

    confirmPassword.setAttribute("type", type);

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");

});

// ===============================
// Password Match Validation
// ===============================

confirmPassword.addEventListener("keyup", function () {

    if (password.value === "" || confirmPassword.value === "") {
        confirmPassword.style.borderColor = "#e6edf3";
        return;
    }

    if (password.value === confirmPassword.value) {
        confirmPassword.style.borderColor = "#198754";
    } else {
        confirmPassword.style.borderColor = "#dc3545";
    }

});

// ===============================
// Form Validation
// ===============================

document.querySelector("form").addEventListener("submit", function (e) {

    if (password.value !== confirmPassword.value) {

        e.preventDefault();

        alert("Passwords do not match!");

    }

});