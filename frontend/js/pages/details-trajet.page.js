import { apiFetch } from "../api/client.js";
import { getToken } from "../auth/session.js";

function getTrajetId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function chargerDetailsTrajet() {

    const id = getTrajetId();

    if (!id) {
        afficherErreur("Trajet introuvable.");
        return;
    }

    try {

        const trajet = await apiFetch(`/api/trajets/${id}`);

        afficherTrajet(trajet);

        initialiserReservation(id);

    } catch (error) {

        console.error(error);
        afficherErreur("Impossible de charger le trajet.");

    }
}

function afficherTrajet(trajet) {

    document.getElementById("trajet-depart").textContent =
        trajet.departVille || "";

    document.getElementById("trajet-arrivee").textContent =
        trajet.arriveeVille || "";

    document.getElementById("trajet-date").textContent =
        new Date(trajet.dateDepart).toLocaleString("fr-FR");

    document.getElementById("trajet-conducteur").textContent =
        trajet.conducteurNomComplet || "Conducteur";

    document.getElementById("trajet-vehicule").textContent =
        trajet.vehiculeLabel || "Non renseigné";

    document.getElementById("trajet-energie").textContent =
        trajet.energie || "Non renseignée";

    document.getElementById("trajet-places").textContent =
        trajet.placesRestantes ?? "0";

    document.getElementById("trajet-prix").textContent =
        trajet.prixParPlace ?? "0";

}

function initialiserReservation(idTrajet) {

    const bouton = document.getElementById("btn-participer");

    if (!bouton) return;

    bouton.addEventListener("click", async () => {

        if (!getToken()) {

            alert("Vous devez être connecté pour réserver.");
            window.history.pushState({}, "", "/connexion");
            window.dispatchEvent(new Event("popstate"));
            return;

        }

        const confirmation = confirm(
            "Voulez-vous participer à ce covoiturage ?"
        );

        if (!confirmation) return;

        try {

            await apiFetch("/api/reservations", {
                method: "POST",
                body: JSON.stringify({
                    trajetId: idTrajet
                })
            });

            alert("Réservation confirmée.");

            window.location.reload();

        } catch (error) {

            console.error(error);
            alert("Impossible de réserver ce trajet.");

        }

    });
}

function afficherErreur(message) {

    const container = document.getElementById("detail-trajet-container");

    if (!container) return;

    container.innerHTML =
        `<div class="alert alert-danger">${message}</div>`;
}

chargerDetailsTrajet();