import Chart from "chart.js/auto";
import { apiFetch } from "../api/client.js";

let chartCovoiturages = null;
let chartGains = null;

async function chargerStats() {
    const zoneResume = document.getElementById("admin-stats");
    const canvasCovoiturages = document.getElementById("chart-covoiturages");
    const canvasGains = document.getElementById("chart-gains");

    if (!zoneResume || !canvasCovoiturages || !canvasGains) return;

    try {
        const total = await apiFetch("/api/admin/stats/gains-total");
        const covoiturages = await apiFetch("/api/admin/stats/covoiturages-par-jour");
        const gains = await apiFetch("/api/admin/stats/gains-par-jour");

        zoneResume.innerHTML = `
            <div class="alert alert-success">
                Total des crédits gagnés par la plateforme : <strong>${total.creditsPlateformeTotal}</strong>
            </div>
        `;

        const labelsCovoiturages = covoiturages.map(item => item.jour);
        const dataCovoiturages = covoiturages.map(item => item.nbPlacesReservees);

        const labelsGains = gains.map(item => item.jour);
        const dataGains = gains.map(item => item.creditsPlateforme);

        if (chartCovoiturages) {
            chartCovoiturages.destroy();
        }

        if (chartGains) {
            chartGains.destroy();
        }

        chartCovoiturages = new Chart(canvasCovoiturages, {
            type: "bar",
            data: {
                labels: labelsCovoiturages,
                datasets: [{
                    label: "Places réservées",
                    data: dataCovoiturages
                }]
            }
        });

        chartGains = new Chart(canvasGains, {
            type: "line",
            data: {
                labels: labelsGains,
                datasets: [{
                    label: "Crédits gagnés",
                    data: dataGains
                }]
            }
        });

    } catch (error) {
        console.error(error);
        zoneResume.innerHTML = `<div class="alert alert-danger">Impossible de charger les statistiques.</div>`;
    }
}

async function chargerUtilisateurs() {
    const container = document.getElementById("admin-users");
    if (!container) return;

    try {
        const reponse = await apiFetch("/api/admin/utilisateurs");
        const utilisateurs = reponse.items || [];

        if (utilisateurs.length === 0) {
            container.innerHTML = `<div class="alert alert-warning">Aucun utilisateur trouvé.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="table table-bordered table-striped">
                <thead class="table-success">
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${utilisateurs.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.prenom} ${user.nom}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>
                                ${user.isSuspended
                ? '<span class="badge bg-danger">Suspendu</span>'
                : '<span class="badge bg-success">Actif</span>'}
                            </td>
                            <td>
                                ${user.isSuspended
                ? `<button class="btn btn-success btn-sm btn-reactiver" data-id="${user.id}">Réactiver</button>`
                : `<button class="btn btn-danger btn-sm btn-suspendre" data-id="${user.id}">Suspendre</button>`}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        ajouterEvenementsUtilisateurs();

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="alert alert-danger">Impossible de charger les utilisateurs.</div>`;
    }
}

function ajouterEvenementsUtilisateurs() {
    document.querySelectorAll(".btn-suspendre").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await apiFetch(`/api/admin/utilisateurs/${btn.dataset.id}/suspendre`, {
                    method: "PATCH"
                });
                alert("Compte suspendu.");
                chargerUtilisateurs();
            } catch (error) {
                console.error(error);
                alert("Impossible de suspendre ce compte.");
            }
        });
    });

    document.querySelectorAll(".btn-reactiver").forEach((btn) => {
        btn.addEventListener("click", async () => {
            try {
                await apiFetch(`/api/admin/utilisateurs/${btn.dataset.id}/reactiver`, {
                    method: "PATCH"
                });
                alert("Compte réactivé.");
                chargerUtilisateurs();
            } catch (error) {
                console.error(error);
                alert("Impossible de réactiver ce compte.");
            }
        });
    });
}

function initialiserFormEmploye() {
    const form = document.getElementById("form-employe");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            prenom: document.getElementById("prenom").value.trim(),
            nom: document.getElementById("nom").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim()
        };

        try {
            await apiFetch("/api/admin/employes", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            alert("Employé créé avec succès.");
            form.reset();
            chargerUtilisateurs();
        } catch (error) {
            console.error(error);
            alert("Impossible de créer l'employé.");
        }
    });
}

chargerStats();
chargerUtilisateurs();
initialiserFormEmploye();