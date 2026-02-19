import { listTrajets, createReservation, getTrajet } from "../api/trajets.js";

// Mini toast (simple)
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
  return d.toLocaleString();
}

// 1) Affichage des trajets (sans onclick, on utilise addEventListener)
function afficherTrajets(trajets) {
  const zone = document.getElementById("trajetsRoot");
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
        card.querySelector("[data-role='places']").textContent = trajetMisAJour.placesRestantes;

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

// 2) Chargement initial
async function chargerTrajets() {
  const loading = document.getElementById("loading");
  loading?.classList.remove("d-none");

  try {
    const trajets = await listTrajets();
    afficherTrajets(trajets);
  } catch (e) {
    afficherMessage(e?.data?.message || e.message || "Impossible de charger les trajets.");
  } finally {
    loading?.classList.add("d-none");
  }
}

// IMPORTANT avec ton router : le script est injecté après le HTML,
// donc DOMContentLoaded peut déjà être passé.
// => on lance direct.
chargerTrajets();
