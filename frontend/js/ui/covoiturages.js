import { listTrajets, createReservation, getTrajet } from "../api/trajets.js";
import { isConnected, getFrontRoles } from "../auth/session.js";

/*
  Ce fichier s’occupe juste de l’affichage + réservation :

  - Je reçois des filtres (depart/arrivee/date) depuis la page
  - Je récupère la liste des trajets avec l’API
  - J’affiche les trajets sous forme de cartes
  - Je permets de réserver si l’utilisateur est connecté et passager
*/

function afficherMessage(message) {
  const toast = document.getElementById("toast");
  if (!toast) return alert(message);

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(afficherMessage._t);
  afficherMessage._t = setTimeout(() => toast.classList.remove("show"), 2500);
}

function formaterDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR");
}

function redirectTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

function norm(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function startsWithCity(city, typed) {
  if (!typed) return true;
  return norm(city).startsWith(norm(typed));
}

function sameDate(isoDateTime, yyyyMmDd) {
  if (!yyyyMmDd) return true;
  if (!isoDateTime) return false;

  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return false;

  return d.toISOString().split("T")[0] === yyyyMmDd;
}

function afficherTrajets(trajets) {
  const zone = document.getElementById("trajetsRoot");
  if (!zone) return;

  zone.innerHTML = "";

  if (!Array.isArray(trajets) || trajets.length === 0) {
    zone.innerHTML = `<p class="text-center my-4">Aucun trajet disponible.</p>`;
    return;
  }

  trajets.forEach((trajet) => {
    const card = document.createElement("div");
    card.className = "card shadow-sm mb-3";
    card.dataset.trajetId = trajet.id;

    card.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h5 class="card-title mb-1">${trajet.departVille} → ${trajet.arriveeVille}</h5>
            <div class="small text-muted">${formaterDate(trajet.dateDepart)}</div>
          </div>

          <div class="text-end">
            <div class="small">
              Places restantes :
              <strong data-role="places">${trajet.placesRestantes}</strong>
            </div>
            <div class="small">
              Prix :
              <strong>${trajet.prixParPlace} €</strong>
            </div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2 mt-3 flex-wrap">
          <label class="small text-muted me-1">Places :</label>
          <input class="form-control form-control-sm" style="max-width:110px" type="number" min="1" value="1" />
          <button class="btn btn-success btn-sm" data-role="reserve">Réserver</button>
        </div>
      </div>
    `;

    const input = card.querySelector("input");
    const btn = card.querySelector("button[data-role='reserve']");

    if (trajet.placesRestantes <= 0) {
      btn.disabled = true;
      btn.textContent = "Complet";
    }

    btn.addEventListener("click", async () => {
      if (!isConnected()) {
        afficherMessage("Connectez-vous pour réserver.");
        redirectTo("/connexion");
        return;
      }

      const roles = getFrontRoles();
      if (!roles.includes("passager")) {
        afficherMessage("Seuls les passagers peuvent réserver un trajet.");
        return;
      }

      const nbPlaces = Number(input.value || 1);
      if (!Number.isFinite(nbPlaces) || nbPlaces <= 0) {
        afficherMessage("Nombre de places invalide.");
        return;
      }

      btn.disabled = true;
      const texteAvant = btn.textContent;
      btn.textContent = "Réservation…";

      try {
        const res = await createReservation(trajet.id, nbPlaces);
        afficherMessage(res?.message || "Réservation créée.");

        const trajetMisAJour = await getTrajet(trajet.id);
        card.querySelector("[data-role='places']").textContent =
          trajetMisAJour.placesRestantes;

        if (trajetMisAJour.placesRestantes <= 0) {
          btn.disabled = true;
          btn.textContent = "Complet";
          return;
        }
      } catch (e) {
        afficherMessage(e?.data?.message || e.message || "Erreur réservation.");
        btn.disabled = false;
        btn.textContent = texteAvant;
        return;
      }

      btn.disabled = false;
      btn.textContent = texteAvant;
    });

    zone.appendChild(card);
  });
}

/*
  Je charge les trajets en utilisant des filtres fournis par la page.
  depart/arrivee : "commence par"
  date : date exacte YYYY-MM-DD
*/
export async function chargerTrajets({ depart, arrivee, date }) {
  const zone = document.getElementById("trajetsRoot");
  if (!zone) return;

  try {
    const trajets = await listTrajets();

    const filtered = trajets.filter((t) => {
      return (
        startsWithCity(t.departVille, depart) &&
        startsWithCity(t.arriveeVille, arrivee) &&
        sameDate(t.dateDepart, date)
      );
    });

    afficherTrajets(filtered);
  } catch (e) {
    afficherMessage(
      e?.data?.message || e.message || "Impossible de charger les trajets."
    );
  }
}