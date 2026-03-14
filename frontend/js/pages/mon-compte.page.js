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
      ${items
            .map(
                (t) => `
        <li class="list-group-item">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div><strong>${t.departVille} → ${t.arriveeVille}</strong></div>
              <div class="small text-muted">${fmtDate(t.dateDepart)} • ${t.roleDansTrajet ?? ""}</div>
              ${t.statut ? `<div class="small">Statut : ${t.statut}</div>` : ""}
              ${t.prixParPlace != null ? `<div class="small">Prix/place : ${t.prixParPlace} crédits</div>` : ""}
              ${t.nbPlaces != null ? `<div class="small">Places réservées : ${t.nbPlaces}</div>` : ""}
            </div>
            ${t.id ? `<a class="btn btn-sm btn-outline-primary" href="/details-trajet?id=${t.id}" onclick="route(event)">Détails</a>` : ""}
          </div>
        </li>
      `
            )
            .join("")}
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

    if (!estChauffeur) {
        blocVehicules.style.display = "none";
    } else {
        blocVehicules.style.display = "";
    }
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

    let utilisateur = null;

    // 1) Récap utilisateur
    try {
        utilisateur = await apiFetch("/api/me");
        const nom = `${utilisateur.prenom ?? ""} ${utilisateur.nom ?? ""}`.trim();

        if (nomEl) nomEl.textContent = nom || "—";
        if (emailEl) emailEl.textContent = utilisateur.email ?? "—";
        if (soldeEl) soldeEl.textContent = String(utilisateur.soldeCredits ?? "0");

        if (avatarImageEl) {
            avatarImageEl.src = getAvatarPath(utilisateur.avatar);
        }

        if (avatarSelectEl && utilisateur.avatar) {
            avatarSelectEl.value = utilisateur.avatar;
        }

        gererBlocVehicules(utilisateur.roles || []);
    } catch (e) {
        if (avenirEl) avenirEl.innerHTML = `<p class="text-danger">Non connecté.</p>`;
        if (passeEl) passeEl.innerHTML = "";
        if (vehiculesEl) vehiculesEl.innerHTML = "";
        return;
    }

    // 2) Aperçu avatar en direct
    if (avatarSelectEl && avatarImageEl) {
        avatarSelectEl.addEventListener("change", () => {
            avatarImageEl.src = getAvatarPath(avatarSelectEl.value);
        });
    }

    // 3) Sauvegarde avatar
    if (avatarSaveBtn && avatarSelectEl && avatarImageEl) {
        avatarSaveBtn.addEventListener("click", async () => {
            try {
                const reponse = await apiFetch("/api/me/avatar", {
                    method: "PATCH",
                    body: JSON.stringify({
                        avatar: avatarSelectEl.value
                    })
                });

                avatarImageEl.src = getAvatarPath(reponse.avatar);
                alert("Avatar mis à jour.");
            } catch (e) {
                console.error(e);
                alert(e.message || "Impossible de mettre à jour l'avatar.");
            }
        });
    }

    // 4) Historique trajets
    if (avenirEl) avenirEl.innerHTML = "Chargement…";
    if (passeEl) passeEl.innerHTML = "Chargement…";

    try {
        const hist = await apiFetch("/api/me/historique");
        if (avenirEl) avenirEl.innerHTML = renderTrajets(hist.avenir);
        if (passeEl) passeEl.innerHTML = renderTrajets(hist.passe);
    } catch (e) {
        if (avenirEl) avenirEl.innerHTML = `<p class="text-danger">${e.message}</p>`;
        if (passeEl) passeEl.innerHTML = "";
    }

    // 5) Mes véhicules
    if (vehiculesEl) {
        if ((utilisateur.roles || []).includes("ROLE_CHAUFFEUR")) {
            vehiculesEl.innerHTML = "Chargement…";

            try {
                const vehicules = await apiFetch("/api/me/vehicules");
                vehiculesEl.innerHTML = renderVehicules(vehicules);
            } catch (e) {
                vehiculesEl.innerHTML = `<p class="text-danger">${e.message}</p>`;
            }
        } else {
            vehiculesEl.innerHTML = "";
        }
    }

    // 6) Supprimer / anonymiser le compte
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("Confirmer la suppression/anonymisation du compte ?")) return;

            try {
                await apiFetch("/api/me", { method: "DELETE" });
                alert("Compte anonymisé.");
                clearToken();
                window.history.pushState({}, "", "/connexion");
                window.dispatchEvent(new Event("popstate"));
            } catch (e) {
                alert(e.message);
            }
        });
    }
}

run();