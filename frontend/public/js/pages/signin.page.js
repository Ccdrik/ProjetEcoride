// ==========================================================
// PAGE CONNEXION
// ==========================================================
// Permet à l’utilisateur de se connecter
// puis stocke le JWT et met à jour le menu.
//
// IMPORTANT (SPA + Router) :
// - Le Router injecte le HTML puis charge ce fichier en <script type="module">
// - Donc on DOIT exécuter initSignin() tout de suite,
//   sinon aucun eventListener ne sera branché.
// ==========================================================

import { loginUser } from "../api/auth.js";
import { setToken } from "../api/client.js";
import { applyNavbarVisibility, getFrontRoles } from "../auth/session.js";

export function initSignin() {
    const form = document.querySelector("form");
    if (!form) return;

    // éviter double binding si jamais re-init
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = form.querySelector("input[name='email']")?.value?.trim();
        const password = form.querySelector("input[name='password']")?.value;

        try {
            const response = await loginUser(email, password);
            setToken(response.token);

            // MAJ menu (connecté / rôles)
            applyNavbarVisibility();

            // Redirection SPA (selon rôle)
            const target = "/";

            window.history.pushState({}, "", target);
            window.dispatchEvent(new Event("popstate")); //  déclenche le Router
        } catch (err) {
            alert(err?.data?.message || err.message || "Erreur connexion.");
        }
    });
}

// ==========================================================
// AUTO-INIT
// ==========================================================
// Comme le Router charge ce fichier après injection HTML,
// DOMContentLoaded peut déjà être passé -> on lance direct.
initSignin();