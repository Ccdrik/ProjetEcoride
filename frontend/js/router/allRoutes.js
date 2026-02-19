import Route from './Route.js';

// Définir ici vos routes
export const allRoutes = [
  new Route("/", "Accueil", "/pages/home.html", []),

  // Trajets (API Symfony): liste + réservation
  new Route("/covoiturages", "Covoiturages", "/pages/covoiturages.html", [], "/js/ui/covoiturages.js"),

  // Pages statiques existantes
  new Route("/contact", "Contact", "/pages/contact.html", []),
  new Route("/trajet", "Détails du trajet", "/pages/details.html", []),
  new Route("/mentionslegales", "Mentions légales", "/pages/mentionslegales.html", []),

  // Auth / dashboards (les scripts n'étaient pas présents dans ton zip => routes conservées sans JS pour éviter 404)
  new Route("/signin", "Connexion", "/pages/auth/signin.html", ["disconnected"]),
  new Route("/signup", "Inscription", "/pages/auth/signup.html", ["disconnected"]),
  new Route("/account", "Mon Compte", "/pages/auth/account.html", ["passager", "chauffeur", "employe", "admin"]),
  new Route("/editPassword", "Changement de mot de passe", "/pages/auth/editPassword.html", ["passager", "chauffeur", "employe", "admin"]),
  new Route("/creertrajet", "Créer un trajet", "/pages/creertrajet.html", ["chauffeur"]),
  new Route("/edittrajet", "Modifier un trajet", "/pages/edittrajet.html", ["chauffeur"]),
];

// Le titre s'affiche comme ceci : Route.titre - websitename
export const websiteName = "EcoRide";
