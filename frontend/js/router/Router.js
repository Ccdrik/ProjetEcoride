import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

// Route 404
const route404 = new Route("404", "Page introuvable", "/pages/404.html", []);

// Trouver la route qui correspond à l’URL
const getRouteByUrl = (url) => {
    let currentRoute = null;

    allRoutes.forEach((element) => {
        if (element.url == url) currentRoute = element;
    });

    return currentRoute ?? route404;
};

// Charger le contenu de la page (HTML + JS)
const LoadContentPage = async () => {
    // Base URL (utile si ton app est dans un sous-dossier)
    const baseURL = "/";

    // Récupérer le chemin courant
    let currentPath = window.location.pathname;

    // Retirer baseURL si besoin
    if (currentPath.indexOf(baseURL) === 0) {
        currentPath = currentPath.replace(baseURL, "");
    }

    // Normaliser la racine
    if (currentPath === "" || currentPath === "/") {
        currentPath = "/";
    }

    // Route actuelle
    const actualRoute = getRouteByUrl(currentPath);

    // ---- Gestion des droits (si ta route a authorize) ----
    const allRolesArray = actualRoute.authorize;

    if (allRolesArray.length > 0) {
        // Cas “disconnected” : page réservée aux non connectés (login/register)
        if (allRolesArray.includes("disconnected")) {
            if (isConnected()) {
                window.location.replace("/");
                return;
            }
        } else {
            // Cas rôles (ADMIN / EMPLOYE / etc.)
            const roleUser = getRole();
            if (!allRolesArray.includes(roleUser)) {
                window.location.replace("/");
                return;
            }
        }
    }

    // ---- Charger le HTML ----
    // no-store = évite les vieux HTML en cache pendant le dev
    const html = await fetch(actualRoute.pathHtml, { cache: "no-store" })
        .then((data) => data.text());

    // Injecter le HTML dans ton conteneur
    const container = document.getElementById("main-page");
    if (!container) {
        console.error('Router: élément #main-page introuvable dans index.html');
        return;
    }
    container.innerHTML = html;

    // ---- Charger le JS de la page (si besoin) ----
    if (actualRoute.pathJS && actualRoute.pathJS !== "") {
        const old = document.getElementById("route-script");
        if (old) old.remove();

        const scriptTag = document.createElement("script");
        scriptTag.setAttribute("id", "route-script");
        scriptTag.setAttribute("type", "module");
        scriptTag.setAttribute("src", actualRoute.pathJS);
        document.body.appendChild(scriptTag);
    }

    // ---- Titre du site ----
    document.title = `${actualRoute.title} - ${websiteName}`;

    // ---- Afficher/masquer selon rôle (menu, boutons, etc.) ----
    showAndHideElementsForRoles();

    // ---- IMPORTANT : signaler que la route a changé ----
    // Permet à main.js (ou autre) de lancer un init après injection du HTML
    window.dispatchEvent(new CustomEvent("route:changed", {
        detail: {
            url: actualRoute.url,
            name: actualRoute.name,
            title: actualRoute.title,
        }
    }));
};

// Gestion clic sur liens
const routeEvent = (event) => {
    event = event || window.event;
    event.preventDefault();

    // event.currentTarget = l’élément qui a le handler (le <a>)
    // event.target = l’élément cliqué à l’intérieur (icone, span, etc.)
    const link = event.currentTarget;

    window.history.pushState({}, "", link.href);
    LoadContentPage();
};

// Back / forward navigateur
window.onpopstate = LoadContentPage;

// Rendre accessible route() dans le HTML: onclick="route(event)"
window.route = routeEvent;

// Chargement initial
LoadContentPage();
