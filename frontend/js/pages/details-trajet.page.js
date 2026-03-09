import { apiFetch } from "../api/client.js";
import { getToken } from "../auth/session.js";

async function chargerDetailsTrajet() {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        afficherErreur("Trajet introuvable.");
        return;
    }

    try {

        const trajet = await apiFetch(`/api/trajets/${id}`);

        document.getElementById("trajet-depart").textContent = trajet.departVille;
        document.getElementById("trajet-arrivee").textContent = trajet.arriveeVille;

        document.getElementById("trajet-date").textContent =
            new Date(trajet.dateDepart).toLocaleString("fr-FR");

        document.getElementById("trajet-prix").textContent =
            trajet.prixParPlace;

        document.getElementById("trajet-places").textContent =
            trajet.placesRestantes;

        document.getElementById("trajet-conducteur").textContent =
            trajet.conducteurNomComplet || "Conducteur";

        document.getElementById("trajet-vehicule").textContent =
            trajet.vehiculeLabel || "Non renseigné";

        document.getElementById("trajet-energie").textContent =
            trajet.energie || "Non renseignée";

        ajouterReservation(id);

    } catch (error) {

        console.error(error);
        afficherErreur("Impossible de charger le trajet");

    }
}

function ajouterReservation(idTrajet) {

    const btn = document.getElementById("btn-participer");

    btn.addEventListener("click", async () => {

        if (!getToken()) {
            window.location.href = "/pages/auth/signin.html";
            return;
        }

        const confirmation = confirm("Voulez-vous réserver ce trajet ?");

        if (!confirmation) return;

        try {

            await apiFetch("/api/reservations", {
                method: "POST",
                body: JSON.stringify({ trajetId: idTrajet })
            });

            alert("Réservation confirmée !");
            window.location.reload();

        } catch (error) {

            console.error(error);
            alert("Impossible de réserver.");

        }

    });
}

function afficherErreur(message) {

    const zone = document.getElementById("detail-trajet-container");

    zone.innerHTML =
        `<div class="alert alert-danger">${message}</div>`;
}

document.addEventListener("DOMContentLoaded", chargerDetailsTrajet);