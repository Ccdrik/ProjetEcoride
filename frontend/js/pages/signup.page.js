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

function validateTextField(input) {
    const value = input.value.trim();

    if (value.length === 0) {
        setFieldState(input, null);
        return false;
    }

    const isValid = value.length >= 2;
    setFieldState(input, isValid);
    return isValid;
}

function validateEmailField(input) {
    const value = input.value.trim();

    if (value.length === 0) {
        setFieldState(input, null);
        return false;
    }

    const isValid = EMAIL_REGEX.test(value);
    setFieldState(input, isValid);
    return isValid;
}

function validatePasswordField(input) {
    const value = input.value;

    if (value.length === 0) {
        setFieldState(input, null);
        return false;
    }

    const isValid = PASSWORD_REGEX.test(value);
    setFieldState(input, isValid);
    return isValid;
}

function validateConfirmField(passwordInput, confirmInput) {
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (confirm.length === 0) {
        setFieldState(confirmInput, null);
        return false;
    }

    const isValid = password.length > 0 && password === confirm;
    setFieldState(confirmInput, isValid);
    return isValid;
}

function validateRoleField(select) {
    const value = select.value;

    if (!value) {
        setFieldState(select, false);
        return false;
    }

    setFieldState(select, true);
    return true;
}

export function initSignup() {
    const form = document.querySelector("#signup-form");
    if (!form) return;

    const nomInput = form.querySelector("input[name='nom']");
    const prenomInput = form.querySelector("input[name='prenom']");
    const emailInput = form.querySelector("input[name='email']");
    const passwordInput = form.querySelector("input[name='password']");
    const confirmInput = form.querySelector("#ValidatePasswordInput");
    const roleSelect = form.querySelector("select[name='role']");
    const submitButton = document.querySelector("#btn-validation-inscription");

    nomInput?.addEventListener("input", () => validateTextField(nomInput));
    prenomInput?.addEventListener("input", () => validateTextField(prenomInput));
    emailInput?.addEventListener("input", () => validateEmailField(emailInput));

    passwordInput?.addEventListener("input", () => {
        validatePasswordField(passwordInput);

        if (confirmInput.value.length > 0) {
            validateConfirmField(passwordInput, confirmInput);
        }
    });

    confirmInput?.addEventListener("input", () =>
        validateConfirmField(passwordInput, confirmInput)
    );

    roleSelect?.addEventListener("change", () => validateRoleField(roleSelect));

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nomValid = validateTextField(nomInput);
        const prenomValid = validateTextField(prenomInput);
        const emailValid = validateEmailField(emailInput);
        const passwordValid = validatePasswordField(passwordInput);
        const confirmValid = validateConfirmField(passwordInput, confirmInput);
        const roleValid = validateRoleField(roleSelect);

        const isFormValid =
            nomValid &&
            prenomValid &&
            emailValid &&
            passwordValid &&
            confirmValid &&
            roleValid;

        if (!isFormValid) return;

        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value,
            nom: nomInput?.value?.trim(),
            prenom: prenomInput?.value?.trim(),
            role: roleSelect?.value || "ROLE_PASSAGER",
        };

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Inscription en cours...";
            }

            await registerUser(payload);
            alert("Compte créé. Vous pouvez vous connecter.");

            window.history.pushState({}, "", "/connexion");
            window.dispatchEvent(new Event("popstate"));
        } catch (err) {
            alert(err?.data?.message || err.message || "Erreur inscription.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Inscription";
            }
        }
    });
}

initSignup();