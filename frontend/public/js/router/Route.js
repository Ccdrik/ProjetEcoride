export default class Route {
    constructor(url, title, pathHtml, authorize, pathJS = "") {
        this.url = url;               // URL "front" (ex: /connexion)
        this.title = title;           // Titre affiché dans l'onglet
        this.pathHtml = pathHtml;     // Chemin HTML à injecter
        this.pathJS = pathJS;         // Script page (optionnel)
        this.authorize = authorize;   // Règles d’accès (voir commentaire plus bas)
    }
}

/*
  authorize :

  [] -> Tout le monde peut y accéder

  ["disconnected"] -> Réservé aux utilisateurs déconnectés (login/register)

  ["passager"] -> Réservé aux utilisateurs avec le rôle passager
  ["chauffeur"] -> Réservé aux utilisateurs avec le rôle chauffeur
  ["admin"] -> Réservé aux utilisateurs avec le rôle admin
  ["employe"] -> Réservé aux utilisateurs avec le rôle employe

  ["passager", "chauffeur"] -> passager OU chauffeur
*/