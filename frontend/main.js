import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap";
import "./assets/css/main.css";

import "./js/router/Router.js";

// page dispatcher (1 page = 1 script)
import { initCovoiturages } from "./js/pages/covoiturages.page.js";
import { initCreerTrajet } from "./js/pages/creer-trajet.page.js";
import { initDetailsTrajet } from "./js/pages/details-trajet.page.js";
import { initModifierTrajet } from "./js/pages/modifier-trajet.page.js";
import { initMesReservations } from "./js/pages/mes-reservations.page.js";

function initCurrentPage() {
    const page = document.body?.dataset?.page;

    switch (page) {
        case "covoiturages":
            initCovoiturages();
            break;
        case "creer-trajet":
            initCreerTrajet();
            break;
        case "details-trajet":
            initDetailsTrajet();
            break;
        case "modifier-trajet":
            initModifierTrajet();
            break;
        case "mes-reservations":
            initMesReservations();
            break;
        default:
            break;
    }
}

// Important si ton Router remplace le contenu dynamiquement :
window.addEventListener("route:changed", initCurrentPage);

// Au chargement initial :
document.addEventListener("DOMContentLoaded", initCurrentPage);
