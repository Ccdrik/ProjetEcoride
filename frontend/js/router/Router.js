import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

// Création d'une route pour la page 404 (page introuvable)
const route404 = new Route("404", "Page introuvable", "/pages/404.html", []);

// Fonction pour récupérer la route correspondant à une URL donnée
const getRouteByUrl = (url) => {
    let currentRoute = null;
    // Parcours de toutes les routes pour trouver la correspondance
    allRoutes.forEach((element) => {
        if (element.url == url) {
            currentRoute = element;
        }
    });
    // Si aucune correspondance n'est trouvée, on retourne la route 404
    if (currentRoute != null) {
        return currentRoute;
    } else {
        return route404;
    }
};

// Fonction pour charger le contenu de la page
const LoadContentPage = async () => {
    // Définir la base de votre application (à ajuster selon votre configuration)
    const baseURL = "/";

    // Récupérer le chemin courant et retirer le préfixe de base s'il existe
    let currentPath = window.location.pathname;
    if (currentPath.indexOf(baseURL) === 0) {
        currentPath = currentPath.replace(baseURL, "");
    }
    if (currentPath === "" || currentPath === "/") {
        currentPath = "/";
    }

    const actualRoute = getRouteByUrl(currentPath);

    // Vérifier les droits d'accès à la page
    const allRolesArray = actualRoute.authorize;
    if (allRolesArray.length > 0) {
        if (allRolesArray.includes("disconnected")) {
            if (isConnected()) {
                window.location.replace("/");
            }
        } else {
            const roleUser = getRole();
            if (!allRolesArray.includes(roleUser)) {
                window.location.replace("/");
            }
        }
    }

    // Récupération du contenu HTML de la route
    const html = await fetch(actualRoute.pathHtml).then((data) => data.text());
    // Ajouter le contenu HTML à l'élément avec l'ID "main-page"
    document.getElementById("main-page").innerHTML = html;

    // Ajout du contenu JavaScript, si nécessaire
    if (actualRoute.pathJS != "") {
        const old = document.getElementById("route-script");
        if (old) old.remove();
        var scriptTag = document.createElement("script");
        scriptTag.setAttribute("id", "route-script");
        scriptTag.setAttribute("type", "module");
        scriptTag.setAttribute("src", actualRoute.pathJS);
        document.querySelector("body").appendChild(scriptTag);
    }

    // Met à jour le titre de la page
    document.title = actualRoute.title + " - " + websiteName;

    // Afficher et masquer les éléments en fonction du rôle
    showAndHideElementsForRoles();
};

// Fonction pour gérer les événements de routage (clic sur les liens)
const routeEvent = (event) => {
    event = event || window.event;
    event.preventDefault();
    // Mise à jour de l'URL dans l'historique du navigateur
    window.history.pushState({}, "", event.target.href);
    // Chargement du contenu de la nouvelle page
    LoadContentPage();
};

// Gestion de l'événement de retour en arrière dans l'historique du navigateur
window.onpopstate = LoadContentPage;
// Assignation de la fonction routeEvent à la propriété route de la fenêtre
window.route = routeEvent;
// Chargement du contenu de la page au chargement initial
LoadContentPage();