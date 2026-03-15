import { apiFetch, clearToken } from "../api/client.js";

console.log("mon-compte.page.js chargé");

function fmtDate(iso) {
    try {
        return new Date(iso).toLocaleString("fr-FR");
    } catch {
        return iso ?? "";
    }
}

function renderTrajets(items) {
    if (!items || items.length === 0) {
        return `<p class="text-muted">Aucun trajet.</p>`;
    }

    return `
        <ul class="list-group">
            ${items.map((t) => `
                <li class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start gap-3">
                        <div>
                            <div><strong>${t.departVille} → ${t.arriveeVille}</strong></div>
                            <div class="small text-muted">
                                ${fmtDate(t.dateDepart)}${t.roleDansTrajet ? ` • ${t.roleDansTrajet}` : ""}
                            </div>
                            ${t.statut ? `<div class="small">Statut : ${t.statut}</div>` : ""}
                            ${t.prixParPlace != null ? `<div class="small">Prix/place : ${t.prixParPlace} crédits</div>` : ""}
                            ${t.nbPlaces != null ? `<div class="small">Places réservées : ${t.nbPlaces}</div>` : ""}
                        </div>

                        ${t.id
            ? `<a class="btn btn-sm btn-outline-primary" href="/details-trajet?id=${t.id}" onclick="route(event)">Détails</a>`
            : ""
        }
                    </div>
                </li>
            `).join("")}
        </ul>
    `;
}

function renderVehicules(items) {
    if (!items || items.length === 0) {
        return `<p class="text-muted">Aucun véhicule enregistré.</p>`;
    }

    return `
        <ul class="list-group">
            ${items.map((v) => `
                <li class="list-group-item">
                    <div><strong>${v.marque} ${v.modele}</strong></div>
                    ${v.energie ? `<div class="small">Énergie : ${v.energie}</div>` : ""}
                    ${v.couleur ? `<div class="small">Couleur : ${v.couleur}</div>` : ""}
                    ${v.immatriculation ? `<div class="small">Immatriculation : ${v.immatriculation}</div>` : ""}
                    ${v.nbPlaces != null ? `<div class="small">Places : ${v.nbPlaces}</div>` : ""}
                </li>
            `).join("")}
        </ul>
    `;
}

function getAvatarPath(nomFichier) {
    return `/assets/images/avatars/${nomFichier || "passager.png"}`;
}

function gererBlocVehicules(roles = []) {
    const blocVehicules = document.getElementById("blocVehiculesCompte");
    if (!blocVehicules) return;

    const estChauffeur = roles.includes("ROLE_CHAUFFEUR");
    blocVehicules.style.display = estChauffeur ? "" : "none";
}

async function modifierInfosUtilisateur(data) {
    return apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

async function chargerUtilisateur() {
    return apiFetch("/api/me");
}

async function chargerHistorique() {
    return apiFetch("/api/me/historique");
}

async function chargerVehicules() {
    return apiFetch("/api/me/vehicules");
}

async function mettreAJourAvatar(avatar) {
    return apiFetch("/api/me/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatar }),
    });
}

async function supprimerCompte() {
    return apiFetch("/api/me", { method: "DELETE" });
}

async function run() {
    const nomEl = document.querySelector("#mc-nom");
    const emailEl = document.querySelector("#mc-email");
    const soldeEl = document.querySelector("#mc-solde");

    const avenirEl = document.querySelector("#mc-avenir");
    const passeEl = document.querySelector("#mc-passe");
    const vehiculesEl = document.querySelector("#mc-vehicules");

    const deleteBtn = document.querySelector("#mc-delete");

    const avatarImageEl = document.querySelector("#mc-avatar-image");
    const avatarSelectEl = document.querySelector("#mc-avatar");
    const avatarSaveBtn = document.querySelector("#mc-save-avatar");

    const formInfosEl = document.querySelector("#mc-form-infos");
    const nomInputEl = document.querySelector("#mc-input-nom");
    const prenomInputEl = document.querySelector("#mc-input-prenom");
    const emailInputEl = document.querySelector("#mc-input-email");
    const passwordInputEl = document.querySelector("#mc-input-password");

    let utilisateur = null;

    try {
        utilisateur = await chargerUtilisateur();

        const nomComplet = `${utilisateur.prenom ?? ""} ${utilisateur.nom ?? ""}`.trim();

        if (nomEl) nomEl.textContent = nomComplet || "—";
        if (emailEl) emailEl.textContent = utilisateur.email ?? "—";
        if (soldeEl) soldeEl.textContent = String(utilisateur.soldeCredits ?? "0");

        if (nomInputEl) nomInputEl.value = utilisateur.nom ?? "";
        if (prenomInputEl) prenomInputEl.value = utilisateur.prenom ?? "";
        if (emailInputEl) emailInputEl.value = utilisateur.email ?? "";

        if (avatarImageEl) {
            avatarImageEl.src = getAvatarPath(utilisateur.avatar);
        }

        if (avatarSelectEl && utilisateur.avatar) {
            avatarSelectEl.value = utilisateur.avatar;
        }

        gererBlocVehicules(utilisateur.roles || []);
    } catch (e) {
        console.error(e);

        if (nomEl) nomEl.textContent = "Non connecté";
        if (emailEl) emailEl.textContent = "—";
        if (soldeEl) soldeEl.textContent = "—";
        if (avenirEl) avenirEl.innerHTML = `<p class="text-danger">Impossible de charger le compte.</p>`;
        if (passeEl) passeEl.innerHTML = "";
        if (vehiculesEl) vehiculesEl.innerHTML = "";

        return;
    }

    if (formInfosEl) {
        formInfosEl.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                nom: nomInputEl?.value.trim() ?? "",
                prenom: prenomInputEl?.value.trim() ?? "",
                email: emailInputEl?.value.trim() ?? "",
            };

            const motDePasse = passwordInputEl?.value ?? "";
            if (motDePasse.trim() !== "") {
                payload.motDePasse = motDePasse;
            }

            try {
                const reponse = await modifierInfosUtilisateur(payload);
                const u = reponse.utilisateur ?? reponse;
                const nomCompletMaj = `${u.prenom ?? ""} ${u.nom ?? ""}`.trim();

                if (nomEl) nomEl.textContent = nomCompletMaj || "—";
                if (emailEl) emailEl.textContent = u.email ?? "—";

                if (passwordInputEl) {
                    passwordInputEl.value = "";
                }

                alert("Informations mises à jour.");
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible de mettre à jour les informations.");
            }
        });
    }

    if (avatarSelectEl && avatarImageEl) {
        avatarSelectEl.addEventListener("change", () => {
            avatarImageEl.src = getAvatarPath(avatarSelectEl.value);
        });
    }

    if (avatarSaveBtn && avatarSelectEl && avatarImageEl) {
        avatarSaveBtn.addEventListener("click", async () => {
            try {
                const reponse = await mettreAJourAvatar(avatarSelectEl.value);
                avatarImageEl.src = getAvatarPath(reponse.avatar);
                alert("Avatar mis à jour.");
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible de mettre à jour l'avatar.");
            }
        });
    }

    if (avenirEl) avenirEl.innerHTML = `<p class="text-muted">Chargement…</p>`;
    if (passeEl) passeEl.innerHTML = `<p class="text-muted">Chargement…</p>`;

    try {
        const historique = await chargerHistorique();

        if (avenirEl) avenirEl.innerHTML = renderTrajets(historique.avenir);
        if (passeEl) passeEl.innerHTML = renderTrajets(historique.passe);
    } catch (e) {
        console.error(e);

        if (avenirEl) avenirEl.innerHTML = `<p class="text-danger">${e.message || "Erreur de chargement."}</p>`;
        if (passeEl) passeEl.innerHTML = "";
    }

    if (vehiculesEl) {
        if ((utilisateur.roles || []).includes("ROLE_CHAUFFEUR")) {
            vehiculesEl.innerHTML = `<p class="text-muted">Chargement…</p>`;

            try {
                const vehicules = await chargerVehicules();
                vehiculesEl.innerHTML = renderVehicules(vehicules);
            } catch (e) {
                console.error(e);
                vehiculesEl.innerHTML = `<p class="text-danger">${e.message || "Erreur de chargement."}</p>`;
            }
        } else {
            vehiculesEl.innerHTML = "";
        }
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("Confirmer la suppression/anonymisation du compte ?")) {
                return;
            }

            try {
                await supprimerCompte();
                alert("Compte anonymisé.");
                clearToken();
                window.history.pushState({}, "", "/connexion");
                window.dispatchEvent(new Event("popstate"));
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible de supprimer le compte.");
            }
        });
    }
}

run();