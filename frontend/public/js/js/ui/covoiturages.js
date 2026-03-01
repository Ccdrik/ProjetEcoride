import { listTrajets, createReservation, getTrajet } from "../api/trajets.js";
import { isConnected, getFrontRoles } from "../auth/session.js";

// ==========================================================
// UI COVOITURAGES
// ==========================================================
// Ce fichier gère l’affichage des trajets sur /covoiturages :
// - liste des trajets (GET /api/trajets)
// - réservation d’un trajet (POST /api/trajets/{id}/reservations) -> PASSAGER
//
// BONUS :
// - filtre automatique via query params (depuis la Home) :
//   /covoiturages?depart=Paris&arrivee=Lyon&date=2026-02-26
//   -> filtrage "commence par" (départ/arrivée) + date exacte (optionnelle)
//
// IMPORTANT (Router SPA) :
// Le script est injecté après le HTML, donc DOMContentLoaded peut déjà être passé.
// => on lance directement chargerTrajets() en bas de fichier.
// ==========================================================

// ==========================================================
// MINI TOAST (SIMPLE)
// ==========================================================
function afficherMessage(message) {
  const toast = document.getElementById("toast");
  if (!toast) return alert(message);

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(afficherMessage._t);
  afficherMessage._t = setTimeout(() => toast.classList.remove("show"), 2500);
}

// ==========================================================
// FORMAT DATE (FR)
// ==========================================================
function formaterDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR");
}

// ==========================================================
// REDIRECTION SPA (COHÉRENTE AVEC Router.js)
// ==========================================================
// On pushState puis on déclenche popstate pour que le Router recharge la page.
function redirectTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

// ==========================================================
// OUTILS DE FILTRAGE (HOME -> /covoiturages?depart=...)
// ==========================================================
// norm() : normalise pour comparer (minuscules + sans accents)
function norm(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// "commence par" : priorité aux villes dont le nom commence par la saisie
function startsWithCity(city, typed) {
  if (!typed) return true;
  return norm(city).startsWith(norm(typed));
}

// Comparaison date exacte (YYYY-MM-DD)
function sameDate(isoDateTime, yyyyMmDd) {
  if (!yyyyMmDd) return true; // pas de filtre date
  if (!isoDateTime) return false;

  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return false;

  return d.toISOString().split("T")[0] === yyyyMmDd;
}

// ==========================================================
// AFFICHAGE DES TRAJETS (SANS onclick -> addEventListener)
// ==========================================================
function afficherTrajets(trajets) {
  const zone = document.getElementById("trajetsRoot");
  if (!zone) return;

  zone.innerHTML = "";

  if (!Array.isArray(trajets) || trajets.length === 0) {
    zone.innerHTML = `<p class="text-center my-4">Aucun trajet disponible.</p>`;
    return;
  }

  trajets.forEach((trajet) => {
    // 1) créer la carte
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

    // 2) brancher l’événement du bouton
    const input = card.querySelector("input");
    const btn = card.querySelector("button[data-role='reserve']");

    // Si complet => désactiver
    if (trajet.placesRestantes <= 0) {
      btn.disabled = true;
      btn.textContent = "Complet";
    }

    btn.addEventListener("click", async () => {
      // ==========================================================
      //  PROTECTION FRONT (UX) : réserver = PASSAGER uniquement
      // ==========================================================
      if (!isConnected()) {
        afficherMessage("Connectez-vous pour réserver.");
        redirectTo("/connexion");
        return;
      }

      const roles = getFrontRoles(); // ex: ["connected","passager"]
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

        // refresh places restantes
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

      // réactiver si pas complet
      btn.disabled = false;
      btn.textContent = texteAvant;
    });

    // 3) ajouter la carte dans la page
    zone.appendChild(card);
  });
}

// ==========================================================
// CHARGEMENT INITIAL (LISTE + FILTRE URL)
// ==========================================================
async function chargerTrajets() {
  const loading = document.getElementById("loading");
  loading?.classList.remove("d-none");

  try {
    const trajets = await listTrajets();

    // ----------------------------------------------------------
    // FILTRE VIA QUERY PARAMS
    // ex: /covoiturages?depart=Paris&arrivee=Lyon&date=2026-02-26
    // ----------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const departParam = params.get("depart") || "";
    const arriveeParam = params.get("arrivee") || "";
    const dateParam = params.get("date") || ""; // YYYY-MM-DD

    const filtered = trajets.filter((t) => {
      return (
        startsWithCity(t.departVille, departParam) &&
        startsWithCity(t.arriveeVille, arriveeParam) &&
        sameDate(t.dateDepart, dateParam)
      );
    });

    afficherTrajets(filtered);
  } catch (e) {
    afficherMessage(
      e?.data?.message || e.message || "Impossible de charger les trajets."
    );
  } finally {
    loading?.classList.add("d-none");
  }
}



// ==========================================================
// RE-INIT SPA
// ==========================================================
// Le Router déclenche "route:changed" à chaque navigation.
// Comme les modules peuvent être mis en cache, on relance
// le chargement quand on arrive/revient sur /covoiturages.
// ==========================================================
window.addEventListener("route:changed", (e) => {
  const url = e?.detail?.url || window.location.pathname;
  if (url === "/covoiturages") {
    chargerTrajets();
  }
});

// Lancement initial (si on arrive directement sur /covoiturages)
if (window.location.pathname === "/covoiturages") {
  chargerTrajets();
}