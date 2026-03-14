// Ce Router :
// - récupère la route depuis allRoutes
// - vérifie les droits (authorize) selon JWT
// - charge le HTML de la page
// - injecte le script JS de page si nécessaire
// - met à jour le titre
// - met à jour le menu (connecté / rôles)
// 
// ==========================================================

import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";
import { getFrontRoles, isConnected } from "../auth/session.js";
import { applyNavbarVisibility } from "../auth/session.js";

// ==========================================================
// ROUTE 404
// ==========================================================
const route404 = new Route("404", "Page introuvable", "/pages/404.html", []);

// ==========================================================
// TROUVER LA ROUTE PAR URL
// ==========================================================
const getRouteByUrl = (url) => {
    let currentRoute = null;

    allRoutes.forEach((element) => {
        if (element.url === url) currentRoute = element;
    });

    return currentRoute ?? route404;
};

// ==========================================================
// GESTION DES DROITS (authorize)
// ==========================================================
// Règles :
// - authorize = [] => public
// - authorize contient "disconnected" => uniquement si pas connecté
// - sinon => il faut au moins un rôle autorisé
// ==========================================================
function isAllowed(route) {
    const allowed = route.authorize || [];

    // Public
    if (allowed.length === 0) return true;

    // Cas "disconnected"
    if (allowed.includes("disconnected")) {
        return !isConnected();
    }

    // Cas rôles (au moins un rôle doit correspondre)
    const userRoles = getFrontRoles();
    return allowed.some((r) => userRoles.includes(r));
}

// ==========================================================
// REDIRECTION SPA (sans reload)
// ==========================================================
function redirectTo(path) {
    window.history.pushState({}, "", path);
    return LoadContentPage();
}

// ==========================================================
// CHARGEMENT DE PAGE (HTML + JS)
// ==========================================================
const LoadContentPage = async () => {
    const baseURL = "/";

    // 1) Chemin courant
    let currentPath = window.location.pathname;

    // 2) Retirer baseURL si besoin
    if (currentPath.indexOf(baseURL) === 0) {
        currentPath = currentPath.replace(baseURL, "");
    }

    // 3) Normaliser
    if (currentPath === "" || currentPath === "/") {
        currentPath = "/";
    } else {
        currentPath = "/" + currentPath.replace(/^\/+/, "");
    }

    // 4) Route actuelle
    const actualRoute = getRouteByUrl(currentPath);

    // ==========================================================
    //  PROTECTION FRONT (UX)
    // ==========================================================
    // La sécurité réelle est côté API (JWT + access_control).
    // Ici on évite d’afficher une page interdite.
    // ==========================================================
    if (!isAllowed(actualRoute)) {
        // Si pas connecté => connexion
        if (!isConnected()) {
            return redirectTo("/connexion");
        }

        // Si connecté mais mauvais rôle => accueil
        return redirectTo("/");
    }

    // ==========================================================
    // 5) Charger le HTML (avec sécurité)
    // ==========================================================
    let html = "";
    try {
        const res = await fetch(actualRoute.pathHtml, { cache: "no-store" });
        html = await res.text();
    } catch (e) {
        console.error("Router: erreur chargement HTML", e);
        html = `<div class="container py-4">
              <h1>Erreur de chargement</h1>
              <p>Impossible de charger la page.</p>
            </div>`;
    }

    // 6) Injecter HTML
    const container = document.getElementById("main-page");
    if (!container) {
        console.error("Router: élément #main-page introuvable dans index.html");
        return;
    }
    container.innerHTML = html;

    // 7) Charger JS de page (si besoin)
    if (actualRoute.pathJS && actualRoute.pathJS !== "") {
        const old = document.getElementById("route-script");
        if (old) old.remove();

        const scriptTag = document.createElement("script");
        scriptTag.setAttribute("id", "route-script");
        scriptTag.setAttribute("type", "module");

        // important : on force la réexécution du script à chaque changement de page
        scriptTag.setAttribute("src", `${actualRoute.pathJS}?t=${Date.now()}`);

        document.body.appendChild(scriptTag);
    }

    // 8) Titre
    document.title = `${actualRoute.title} - ${websiteName}`;

    // 9) Menu (connecté / rôles)
    applyNavbarVisibility();

    // 10) Event "route:changed" (pour init côté main.js)
    window.dispatchEvent(
        new CustomEvent("route:changed", {
            detail: {
                url: actualRoute.url,
                title: actualRoute.title,
            },
        })
    );
};

// ==========================================================
// CLIC SUR LIENS (SPA)
// ==========================================================
// Dans tes <a>, tu dois avoir onclick="route(event)"
// ==========================================================
const routeEvent = (event) => {
    event = event || window.event;
    event.preventDefault();

    const link = event.currentTarget;

    window.history.pushState({}, "", link.getAttribute("href"));
    LoadContentPage();
};

// Back/forward navigateur
window.onpopstate = LoadContentPage;

// Rendre la fonction accessible dans le HTML : onclick="route(event)"
window.route = routeEvent;

// Chargement initial
LoadContentPage();