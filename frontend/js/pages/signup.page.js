// ==========================================================
// PAGE INSCRIPTION (validation visuelle Bootstrap)
// ==========================================================

import { registerUser } from "../api/auth.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function setFieldState(input, isValid) {
    input.classList.remove("is-valid", "is-invalid");

    if (isValid === true) {
        input.classList.add("is-valid");
    } else if (isValid === false) {
        input.classList.add("is-invalid");
    }
}

export function initSignup() {
    const form = document.querySelector("form");
    if (!form) return;

    const emailInput = form.querySelector("input[name='email']");
    const passwordInput = form.querySelector("input[name='password']");
    const confirmInput = form.querySelector("#ValidatePasswordInput");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        let isFormValid = true;

        //  EMAIL
        const emailValid = EMAIL_REGEX.test(email);
        setFieldState(emailInput, emailValid);
        if (!emailValid) isFormValid = false;

        //  PASSWORD
        const passwordValid = PASSWORD_REGEX.test(password);
        setFieldState(passwordInput, passwordValid);
        if (!passwordValid) isFormValid = false;

        //  CONFIRMATION
        const confirmValid = password === confirm;
        setFieldState(confirmInput, confirmValid);
        if (!confirmValid) isFormValid = false;

        if (!isFormValid) return;

        const payload = {
            email,
            password,
            nom: form.querySelector("input[name='nom']")?.value?.trim(),
            prenom: form.querySelector("input[name='prenom']")?.value?.trim(),
            role: form.querySelector("select[name='role']")?.value || "ROLE_PASSAGER",
        };

        try {
            await registerUser(payload);
            alert("Compte créé. Vous pouvez vous connecter.");

            window.history.pushState({}, "", "/connexion");
            window.dispatchEvent(new CustomEvent("route:changed"));
        } catch (err) {
            alert(err?.data?.message || err.message || "Erreur inscription.");
        }
    });
}