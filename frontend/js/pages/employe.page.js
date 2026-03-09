import { apiFetch } from "../api/client.js";

async function chargerAvisEnAttente() {
    const container = document.getElementById("liste-avis-en-attente");
    if (!container) return;

    try {
        const reponse = await apiFetch("/api/employe/avis/pending");
        const avis = reponse.items || [];

        if (avis.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    Aucun avis en attente.
                </div>
            `;
            return;
        }

        container.innerHTML = avis.map((item) => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Avis sur le trajet #${item.trajetId}</h5>
                    <p><strong>Passager :</strong> ${item.passagerPseudo || "Non renseigné"}</p>
                    <p><strong>Note :</strong> ${item.note}/5</p>
                    <p><strong>Commentaire :</strong> ${item.commentaire || "Aucun commentaire"}</p>
                    <p><strong>Signalé comme problème :</strong> ${item.isProblem ? "Oui" : "Non"}</p>

                    <div class="d-flex gap-2">
                        <button class="btn btn-success btn-valider" data-id="${item.id}">
                            Valider
                        </button>
                        <button class="btn btn-danger btn-refuser" data-id="${item.id}">
                            Refuser
                        </button>
                    </div>
                </div>
            </div>
        `).join("");

        ajouterEvenements();

    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Impossible de charger les avis.
            </div>
        `;
    }
}

function ajouterEvenements() {
    document.querySelectorAll(".btn-valider").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await apiFetch(`/api/employe/avis/${btn.dataset.id}/approve`, {
                    method: "POST"
                });
                alert("Avis validé.");
                chargerAvisEnAttente();
            } catch (error) {
                console.error(error);
                alert("Impossible de valider l'avis.");
            }
        });
    });

    document.querySelectorAll(".btn-refuser").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await apiFetch(`/api/employe/avis/${btn.dataset.id}/reject`, {
                    method: "POST"
                });
                alert("Avis refusé.");
                chargerAvisEnAttente();
            } catch (error) {
                console.error(error);
                alert("Impossible de refuser l'avis.");
            }
        });
    });
}

chargerAvisEnAttente();