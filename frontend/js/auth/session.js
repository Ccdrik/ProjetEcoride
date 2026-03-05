// ==========================================================
// SESSION MANAGER
// ==========================================================
// Permet :
// - savoir si l’utilisateur est connecté
// - récupérer ses rôles depuis le JWT
// - afficher / masquer les éléments du menu
// - expulser automatiquement si token expiré / invalide
// ==========================================================

import { getToken, clearToken } from "../api/client.js";

// ==========================================================
// Décodage du JWT (payload) pour lire roles / exp
// ==========================================================
function decodeJwtPayload(token) {
    try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// ==========================================================
// Vérifie si le JWT est expiré
// exp = timestamp Unix en secondes
// ==========================================================
function isJwtExpired(payload) {
    if (!payload?.exp) return false; // si pas de exp, on ne considère pas expiré
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
}

// ==========================================================
// Récupère un payload VALIDE, sinon null
// - token absent => null
// - token illisible => clear + null
// - token expiré => clear + redirection /connexion + null
// ==========================================================
function getValidPayloadOrNull() {
    const token = getToken();
    if (!token) return null;

    const payload = decodeJwtPayload(token);

    // Token illisible / corrompu
    if (!payload) {
        clearToken();
        return null;
    }

    // Token expiré
    if (isJwtExpired(payload)) {
        clearToken();

        // On redirige vers /connexion (UX)
        if (window.location.pathname !== "/connexion") {
            window.history.pushState({}, "", "/connexion");
            window.dispatchEvent(new Event("popstate"));
        }

        return null;
    }

    // Token OK
    return payload;
}

// ==========================================================
// Session (connected + roles)
// ==========================================================
export function getSession() {
    const payload = getValidPayloadOrNull();

    if (!payload) return { connected: false, roles: [] };

    const roles = payload.roles || [];
    return {
        connected: true,
        roles: Array.isArray(roles) ? roles : [roles],
    };
}

// ==========================================================
// Affichage / masquage du menu selon état + rôles
// ==========================================================
export function applyNavbarVisibility() {
    const session = getSession();

    document.querySelectorAll("[data-show='connected']").forEach((el) => {
        el.style.display = session.connected ? "" : "none";
    });

    document.querySelectorAll("[data-show='disconnected']").forEach((el) => {
        el.style.display = !session.connected ? "" : "none";
    });

    document.querySelectorAll("[data-show='admin']").forEach((el) => {
        el.style.display =
            session.connected && session.roles.includes("ROLE_ADMIN") ? "" : "none";
    });

    document.querySelectorAll("[data-show='chauffeur']").forEach((el) => {
        el.style.display =
            session.connected && session.roles.includes("ROLE_CHAUFFEUR") ? "" : "none";
    });
}

// ==========================================================
// Bouton déconnexion (supprime token + retour accueil)
// ==========================================================
export function bindSignoutButton() {
    const btn = document.getElementById("signout-btn");
    if (!btn) return;

    // Empêche de binder plusieurs fois à chaque route:changed
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
        clearToken();
        applyNavbarVisibility();
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new Event("popstate"));
    });
}

// ==========================================================
// HELPERS POUR LE ROUTER (authorize dans allRoutes)
// ==========================================================
// Le backend renvoie ROLE_XXX
// Le front route utilise: passager/chauffeur/employe/admin/disconnected
// ==========================================================
export function isConnected() {
    return getSession().connected;
}

export function getFrontRoles() {
    const session = getSession();

    // Si pas connecté : rôle spécial "disconnected"
    if (!session.connected) return ["disconnected"];

    const roles = session.roles || [];
    const front = new Set(["connected"]);

    if (roles.includes("ROLE_ADMIN")) front.add("admin");
    if (roles.includes("ROLE_EMPLOYE")) front.add("employe");
    if (roles.includes("ROLE_CHAUFFEUR")) front.add("chauffeur");
    if (roles.includes("ROLE_PASSAGER")) front.add("passager");

    return Array.from(front);
}