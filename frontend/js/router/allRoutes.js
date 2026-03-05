import Route from "./Route.js";

// ==========================================================
// ROUTES DE L'APPLICATION (SPA)
// ==========================================================
// Chaque route décrit :
// - url (ce qu'on met dans le href="/...")
// - title (titre de la page)
// - pathHtml (fichier HTML à injecter)
// - authorize (droits)
// - pathJS (script optionnel lancé après injection)
// ==========================================================
//
// authorize :
// [] -> public (tout le monde)
// ["disconnected"] -> uniquement si NON connecté (connexion / inscription)
// ["passager"] / ["chauffeur"] / ["employe"] / ["admin"] -> connecté avec rôle
// ["passager","chauffeur"] -> passager OU chauffeur
// ==========================================================

export const allRoutes = [
  // ==========================================================
  // ACCUEIL
  // ==========================================================
  new Route("/", "Accueil", "/pages/home.html", [], "/js/pages/home.page.js"),

  // ==========================================================
  // TRAJETS (public)
  // ==========================================================
  new Route("/covoiturages", "Covoiturages", "/pages/covoiturages.html", [], "/js/pages/covoiturages.page.js"),
  new Route("/details-trajet", "Détails du trajet", "/pages/details-trajet.html", [], "/js/pages/details-trajet.page.js"),

  // ==========================================================
  // PAGES STATIQUES (public)
  // ==========================================================
  new Route("/contact", "Contact", "/pages/contact.html", []),
  new Route("/mentions-legales", "Mentions légales", "/pages/mentions-legales.html", []),

  // ==========================================================
  // AUTH (uniquement si déconnecté)
  // ==========================================================
  new Route("/connexion", "Connexion", "/pages/auth/signin.html", ["disconnected"], "/js/pages/signin.page.js"),
  new Route("/inscription", "Inscription", "/pages/auth/signup.html", ["disconnected"], "/js/pages/signup.page.js"),

  // ==========================================================
  // ESPACE UTILISATEUR (connecté)
  // ==========================================================
  new Route("/mon-compte", "Mon Compte", "/pages/auth/mon-compte.html", ["passager", "chauffeur", "employe", "admin"]),
  new Route("/mot-de-passe", "Changement de mot de passe", "/pages/auth/editPassword.html", ["passager", "chauffeur", "employe", "admin"]),

  // ==========================================================
  // CHAUFFEUR
  // ==========================================================
  new Route("/creer-trajet", "Créer un trajet", "/pages/creer-trajet.html", ["chauffeur"], "/js/pages/creer-trajet.page.js"),
  new Route("/modifier-trajet", "Modifier un trajet", "/pages/modifier-trajet.html", ["chauffeur"], "/js/pages/modifier-trajet.page.js"),

  // ==========================================================
  // RÉSERVATIONS (connecté)
  // ==========================================================
  new Route("/mes-reservations", "Mes réservations", "/pages/mes-reservations.html", ["passager", "chauffeur", "employe", "admin"], "/js/pages/mes-reservations.page.js"),

  // ==========================================================
  // ADMIN / EMPLOYÉ
  // ==========================================================
  new Route("/tableau-de-bord", "Tableau de bord", "/pages/tableau-de-bord.html", ["employe", "admin"], "/js/pages/tableau-de-bord.page.js"),
];

// Nom du site (utilisé dans Router.js pour document.title)
export const websiteName = "EcoRide";