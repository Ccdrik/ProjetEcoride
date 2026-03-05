// ==========================================================
// AUTH API
// ==========================================================
// Ce fichier contient les appels liés à l’authentification :
// - inscription
// - connexion
// - récupération du profil
// ==========================================================

import { apiFetch } from "./client.js";

// Inscription utilisateur
export function registerUser(payload) {
    return apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

// Connexion utilisateur
export function loginUser(email, password) {
    return apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

// Récupération du profil connecté
export function getMe() {
    return apiFetch("/api/me");
}