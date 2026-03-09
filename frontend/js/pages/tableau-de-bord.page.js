import { apiFetch } from "../api/client.js";

async function chargerStats() {
    const zoneResume = document.getElementById("admin-stats");
    const zoneCovoiturages = document.getElementById("stats-covoiturages");
    const zoneGains = document.getElementById("stats-gains");

    if (!zoneResume || !zoneCovoiturages || !zoneGains) return;

    try {
        const total = await apiFetch("/api/admin/stats/gains-total");
        const covoiturages = await apiFetch("/api/admin/stats/covoiturages-par-jour");
        const gains = await apiFetch("/api/admin/stats/gains-par-jour");

        zoneResume.innerHTML = `
            <div class="alert alert-success">
                Total des crédits gagnés par la plateforme : <strong>${total.creditsPlateformeTotal}</strong>
            </div>
        `;

        if (!covoiturages.length) {
            zoneCovoiturages.innerHTML = `<div class="alert alert-warning">Aucune donnée.</div>`;
        } else {
            zoneCovoiturages.innerHTML = `
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            <th>Places réservées</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${covoiturages.map(item => `
                            <tr>
                                <td>${item.jour}</td>
                                <td>${item.nbPlacesReservees}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }

        if (!gains.length) {
            zoneGains.innerHTML = `<div class="alert alert-warning">Aucune donnée.</div>`;
        } else {
            zoneGains.innerHTML = `
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            <th>Crédits gagnés</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gains.map(item => `
                            <tr>
                                <td>${item.jour}</td>
                                <td>${item.creditsPlateforme}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }

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