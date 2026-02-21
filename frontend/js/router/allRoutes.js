import Route from "./Route.js";

export const allRoutes = [
  // Accueil (choisis home.html OU accueil.html)
  new Route("/", "Accueil", "/pages/home.html", []),

  // Trajets
  new Route(
    "/covoiturages",
    "Covoiturages",
    "/pages/covoiturages.html",
    [],
    "/js/pages/covoiturages.page.js"
  ),

  new Route(
    "/details-trajet",
    "Détails du trajet",
    "/pages/details-trajet.html",
    [],
    "/js/pages/details-trajet.page.js"
  ),

  // Pages statiques
  new Route("/contact", "Contact", "/pages/contact.html", []),
  new Route("/mentions-legales", "Mentions légales", "/pages/mentions-legales.html", []),

  // Auth
  new Route("/connexion", "Connexion", "/pages/auth/signin.html", ["disconnected"]),
  new Route("/inscription", "Inscription", "/pages/auth/signup.html", ["disconnected"]),
  new Route("/mon-compte", "Mon Compte", "/pages/auth/account.html", ["passager", "chauffeur", "employe", "admin"]),
  new Route("/mot-de-passe", "Changement de mot de passe", "/pages/auth/editPassword.html", ["passager", "chauffeur", "employe", "admin"]),

  // Chauffeur
  new Route(
    "/creer-trajet",
    "Créer un trajet",
    "/pages/creer-trajet.html",
    ["chauffeur"],
    "/js/pages/creer-trajet.page.js"
  ),

  new Route(
    "/modifier-trajet",
    "Modifier un trajet",
    "/pages/modifier-trajet.html",
    ["chauffeur"],
    "/js/pages/modifier-trajet.page.js"
  ),

  // Passager (ou tous connectés selon ton choix)
  new Route(
    "/mes-reservations",
    "Mes réservations",
    "/pages/mes-reservations.html",
    ["passager", "chauffeur", "employe", "admin"],
    "/js/pages/mes-reservations.page.js"
  ),

  // Admin / employé (si tu les utilises)
  new Route(
    "/tableau-de-bord",
    "Tableau de bord",
    "/pages/tableau-de-bord.html",
    ["employe", "admin"],
    "/js/pages/tableau-de-bord.page.js"
  ),
];

export const websiteName = "EcoRide";
