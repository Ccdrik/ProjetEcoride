import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap";

import "./assets/scss/main.scss";

import "./js/router/Router.js";

import { applyNavbarVisibility, bindSignoutButton } from "./js/auth/session.js";
import { initTrajetSearchUI } from "./js/trajets/searchUI.js";

// Au chargement initial
document.addEventListener("DOMContentLoaded", () => {
    applyNavbarVisibility();
    bindSignoutButton();
    initTrajetSearchUI();
});

// Quand le router change de page (HTML remplacé)
window.addEventListener("route:changed", () => {
    applyNavbarVisibility();
    bindSignoutButton();
    initTrajetSearchUI();
});