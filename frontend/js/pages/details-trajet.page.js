import { apiFetch, getToken } from "../api/client.js";

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
        initialiserBlocAvis(trajet, id);
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
        trajet.dateDepart
            ? new Date(trajet.dateDepart).toLocaleString("fr-FR")
            : "";

    document.getElementById("trajet-conducteur").textContent =
        trajet.conducteur
            ? `${trajet.conducteur.prenom || ""} ${trajet.conducteur.nom || ""}`.trim()
            : "Conducteur";

    document.getElementById("trajet-note").textContent =
        trajet.chauffeurNote ?? trajet.noteMoyenne ?? "Non noté";

    document.getElementById("trajet-vehicule").textContent =
        trajet.vehicule
            ? `${trajet.vehicule.marque || ""} ${trajet.vehicule.modele || ""}`.trim()
            : "Non renseigné";

    document.getElementById("trajet-energie").textContent =
        trajet.vehicule?.energie || "Non renseignée";

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
            alert(error?.data?.message || "Impossible de réserver ce trajet.");
        }
    });
}

function initialiserBlocAvis(trajet, idTrajet) {
    const blocAvis = document.getElementById("bloc-avis-trajet");
    const formAvis = document.getElementById("form-avis-trajet");
    const zoneMessage = document.getElementById("message-avis-trajet");

    if (!blocAvis || !formAvis) return;

    if (trajet.statut !== "TERMINE") {
        blocAvis.classList.add("d-none");
        return;
    }

    blocAvis.classList.remove("d-none");

    if (!trajet.reservationId) {
        formAvis.classList.add("d-none");

        if (zoneMessage) {
            zoneMessage.innerHTML = `
                <div class="alert alert-info">
                    Seul un passager ayant participé à ce trajet peut laisser un avis.
                </div>
            `;
        }
        return;
    }

    if (trajet.avisDejaLaisse === true) {
        formAvis.classList.add("d-none");

        if (zoneMessage) {
            zoneMessage.innerHTML = `
                <div class="alert alert-info">
                    Vous avez déjà laissé un avis pour ce trajet.
                </div>
            `;
        }
        return;
    }

    if (formAvis.dataset.listenerAjoute === "1") return;
    formAvis.dataset.listenerAjoute = "1";

    formAvis.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!getToken()) {
            afficherMessageAvis(
                "Vous devez être connecté pour laisser un avis.",
                "danger"
            );
            return;
        }

        const note = document.getElementById("note-avis")?.value;
        const commentaire =
            document.getElementById("commentaire-avis")?.value?.trim() || "";

        if (!note) {
            afficherMessageAvis("Veuillez choisir une note.", "danger");
            return;
        }

        try {
            await apiFetch("/api/avis", {
                method: "POST",
                body: JSON.stringify({
                    reservationId: trajet.reservationId,
                    trajetId: Number(idTrajet),
                    note: Number(note),
                    commentaire,
                    isProblem: false
                })
            });

            formAvis.classList.add("d-none");

            afficherMessageAvis(
                "Votre avis a bien été envoyé. Il sera publié après modération.",
                "success"
            );
        } catch (error) {
            console.error(error);
            afficherMessageAvis(
                error?.data?.message || "Impossible d’envoyer votre avis.",
                "danger"
            );
        }
    });
}

function afficherMessageAvis(message, type = "info") {
    const zone = document.getElementById("message-avis-trajet");
    if (!zone) return;

    zone.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function afficherErreur(message) {
    const container = document.getElementById("detail-trajet-container");

    if (!container) return;

    container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

chargerDetailsTrajet();