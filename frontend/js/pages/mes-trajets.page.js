import { apiFetch } from "../api/client.js";

function formaterDate(dateIso) {
    if (!dateIso) return "Date inconnue";

    return new Date(dateIso).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function getStatutLabel(statut) {
    switch (statut) {
        case "PLANIFIE":
            return "Planifié";
        case "EN_COURS":
            return "En cours";
        case "TERMINE":
            return "Terminé";
        case "ANNULE":
            return "Annulé";
        default:
            return statut || "Inconnu";
    }
}

async function chargerMesTrajets() {
    const zone = document.getElementById("zoneMesTrajets");
    if (!zone) return;

    zone.innerHTML = `<p class="texte-aide-page">Chargement des trajets...</p>`;

    try {
        const data = await apiFetch("/api/me/historique");

        const trajetsChauffeur = (data.avenir || []).filter(
            (t) => t.roleDansTrajet === "CHAUFFEUR"
        );

        if (!trajetsChauffeur.length) {
            zone.innerHTML = `
                <div class="bloc-trajet-chauffeur bloc-trajet-chauffeur--vide">
                    <p>Aucun trajet à venir.</p>
                </div>
            `;
            return;
        }

        zone.innerHTML = trajetsChauffeur.map((t) => `
            <article class="bloc-trajet-chauffeur">
                <div class="bloc-trajet-chauffeur__header">
                    <h3 class="bloc-trajet-chauffeur__titre">${t.departVille} → ${t.arriveeVille}</h3>
                    <span class="bloc-trajet-chauffeur__statut bloc-trajet-chauffeur__statut--${(t.statut || "").toLowerCase()}">
                        ${getStatutLabel(t.statut)}
                    </span>
                </div>

                <div class="bloc-trajet-chauffeur__infos">
                    <p><strong>Date :</strong> ${formaterDate(t.dateDepart)}</p>
                    <p><strong>Prix :</strong> ${t.prixParPlace} crédit(s)</p>
                </div>

                <div class="bloc-trajet-chauffeur__actions">
                    ${t.statut === "PLANIFIE"
                ? `
                        <a class="btn btn-outline-secondary btn-full" href="/modifier-trajet?id=${t.id}" onclick="route(event)">
                            Modifier le trajet
                        </a>

                        <button class="btn btn-danger btn-full btn-annuler" data-id="${t.id}">
                            Annuler le trajet
                        </button>

                        <button class="btn btn-primary btn-full btn-demarrer" data-id="${t.id}">
                            Démarrer le trajet
                        </button>
                    `
                : ""
            }

                    ${t.statut === "EN_COURS"
                ? `<button class="btn btn-success btn-full btn-terminer" data-id="${t.id}">
                            Terminer le trajet
                        </button>`
                : ""
            }

                    ${t.statut === "TERMINE"
                ? `<span class="bloc-trajet-chauffeur__badge-fin">Trajet terminé</span>`
                : ""
            }

                    ${t.statut === "ANNULE"
                ? `<span class="bloc-trajet-chauffeur__badge-fin">Trajet annulé</span>`
                : ""
            }
                </div>
            </article>
        `).join("");

        bindActions();
    } catch (e) {
        console.error(e);
        zone.innerHTML = `
            <div class="bloc-trajet-chauffeur bloc-trajet-chauffeur--vide">
                <p>Erreur lors du chargement des trajets.</p>
            </div>
        `;
    }
}

function bindActions() {
    document.querySelectorAll(".btn-demarrer").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await apiFetch(`/api/trajets/${btn.dataset.id}/demarrer`, {
                    method: "PATCH"
                });
                chargerMesTrajets();
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible de démarrer le trajet.");
            }
        });
    });

    document.querySelectorAll(".btn-terminer").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await apiFetch(`/api/trajets/${btn.dataset.id}/terminer`, {
                    method: "PATCH"
                });
                chargerMesTrajets();
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible de terminer le trajet.");
            }
        });
    });

    document.querySelectorAll(".btn-annuler").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (!confirm("Confirmer l’annulation de ce trajet ?")) return;

            try {
                await apiFetch(`/api/trajets/${btn.dataset.id}/annuler`, {
                    method: "PATCH"
                });
                alert("Trajet annulé.");
                chargerMesTrajets();
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible d’annuler le trajet.");
            }
        });
    });
}

chargerMesTrajets();