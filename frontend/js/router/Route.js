export default class Route {
    constructor(url, title, pathHtml, authorize, pathJS = "") {
        this.url = url;
        this.title = title;
        this.pathHtml = pathHtml;
        this.pathJS = pathJS;
        this.authorize = authorize;
    }
}



/*

[] -> Tout le monde peut y accéder

["disconnected"] -> Réserver aux utilisateurs déconnecté 

["passager"] -> Réserver aux utilisateurs avec le rôle passager 

["chauffeur"] -> Réserver aux utilisateurs avec le rôle chauffeur

["admin"] -> Réserver aux utilisateurs avec le rôle admin 

["passager", "chauffeur"] -> Réserver aux utilisateurs avec le rôle passager OU chauffeur

["employe"] -> Réserver aux utilisateurs avec le rôle employe

*/