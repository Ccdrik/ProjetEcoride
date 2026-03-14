import { listTrajets, createReservation, getTrajet } from "../api/trajets.js";
import { isConnected, getFrontRoles } from "../auth/session.js";

// ==========================================================
// AFFICHAGE DES TRAJETS
// - récupère les trajets
// - filtre
// - affiche les cartes
// - gère la réservation
// ==========================================================

function afficherMessage(message) {
  const toast = document.getElementById("toast");
  if (!toast) return alert(message);

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(afficherMessage._timer);
  afficherMessage._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function formaterDate(dateIso) {
  if (!dateIso) return "";

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;

  return date.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function allerVers(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

function normaliserTexte(texte) {
  return (texte || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function commencePar(ville, saisie) {
  if (!saisie) return true;
  return normaliserTexte(ville).startsWith(normaliserTexte(saisie));
}

function memeDate(dateIso, dateRecherchee) {
  if (!dateRecherchee) return true;
  if (!dateIso) return false;

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return false;

  return date.toISOString().split("T")[0] === dateRecherchee;
}

// ==========================================================
// FONCTIONS DE FILTRES
// ==========================================================

// Je récupère une durée en minutes si elle existe
function recupererDureeTrajet(trajet) {
  const duree = Number(trajet.dureeMinutes);
  return Number.isFinite(duree) ? duree : null;
}

// Je vérifie si le trajet est écologique
function estTrajetEcologique(trajet) {
  return trajet.ecologique === true;
}

// J'applique tous les filtres avancés
function appliquerFiltresAvances(trajets, {
  ecologique,
  prixMax,
  dureeMax,
  noteMin
}) {
  return trajets.filter((trajet) => {
    // Filtre écologique
    if (ecologique && !estTrajetEcologique(trajet)) {
      return false;
    }

    // Filtre prix maximum
    if (prixMax !== "" && Number(trajet.prixParPlace) > Number(prixMax)) {
      return false;
    }

    // Filtre durée maximum
    if (dureeMax !== "") {
      const duree = recupererDureeTrajet(trajet);

      // Si la durée existe et dépasse la valeur choisie, on enlève le trajet
      if (duree !== null && duree > Number(dureeMax)) {
        return false;
      }
    }

    // Filtre note minimum
    if (noteMin !== "") {
      const note = recupererNoteChauffeur(trajet);

      // Si la note existe et est trop basse, on enlève le trajet
      if (note !== null && note < Number(noteMin)) {
        return false;
      }
    }

    return true;
  });
}

// ==========================================================
// AFFICHAGE DES CARTES
// ==========================================================

function afficherTrajets(trajets) {
  const zone = document.getElementById("zoneTrajets");
  if (!zone) return;

  zone.innerHTML = "";

  if (!Array.isArray(trajets) || trajets.length === 0) {
    zone.innerHTML = `
    <div class="alert alert-warning text-center my-4">
      Aucun trajet disponible pour ces critères.
    </div>
  `;
    return;
  }

  trajets.forEach((trajet) => {
    const pseudo =
      trajet.conducteur
        ? `${trajet.conducteur.prenom} ${trajet.conducteur.nom}`
        : "Conducteur";

    const avatar =
      trajet.conducteur?.avatar
        ? `/assets/images/avatars/${trajet.conducteur.avatar}`
        : "/assets/images/avatars/passager.png";

    const note = trajet.noteMoyenne ?? "Non noté";
    const dateDepart = formaterDate(trajet.dateDepart);
    const dateArrivee = trajet.dateArrivee ? formaterDate(trajet.dateArrivee) : "Non renseignée";
    const eco = trajet.ecologique ? "Oui" : "Non";

    const carte = document.createElement("div");
    carte.className = "card shadow-sm mb-3";
    carte.dataset.trajetId = trajet.id;

    carte.innerHTML = `
      <div class="card-body">
          <div class="row g-3 align-items-center">

              <div class="col-md-2 text-center">
                  <img
                      src="${avatar}"
                      alt="Photo du conducteur"
                      class="img-fluid rounded-circle"
                      style="width:80px; height:80px; object-fit:cover;"
                  >
              </div>

              <div class="col-md-6">
                  <h5 class="card-title mb-1">${trajet.departVille} → ${trajet.arriveeVille}</h5>
                  <p class="mb-1"><strong>Conducteur :</strong> ${pseudo}</p>
                  <p class="mb-1"><strong>Départ :</strong> ${dateDepart}</p>
                  <p class="mb-1"><strong>Écologique :</strong> ${eco}</p>
              </div>

              <div class="col-md-4 text-md-end">
                  <p class="mb-1">
                      <strong>Places restantes :</strong>
                      <span data-role="places">${trajet.placesRestantes}</span>
                  </p>
                  <p class="mb-2"><strong>Prix :</strong> ${trajet.prixParPlace} crédits</p>

                  <div class="d-flex flex-wrap gap-2 justify-content-md-end">
                      <button class="btn btn-outline-primary btn-sm" data-role="detail">
                          Détail
                      </button>

                      <input
                          class="form-control form-control-sm"
                          style="max-width:90px"
                          type="number"
                          min="1"
                          value="1"
                      />

                      <button class="btn btn-success btn-sm" data-role="reserve">
                          Réserver
                      </button>
                  </div>
              </div>
          </div>
      </div>
  `;
    const champPlaces = carte.querySelector("input");
    const boutonReserver = carte.querySelector("[data-role='reserve']");
    const boutonDetail = carte.querySelector("[data-role='detail']");

    if (trajet.placesRestantes <= 0) {
      boutonReserver.disabled = true;
      boutonReserver.textContent = "Complet";
    }

    boutonDetail.addEventListener("click", () => {
      allerVers(`/details-trajet?id=${trajet.id}`);
    });

    boutonReserver.addEventListener("click", async () => {
      if (!isConnected()) {
        afficherMessage("Connectez-vous pour réserver.");
        allerVers("/connexion");
        return;
      }

      const roles = getFrontRoles();
      if (!roles.includes("passager")) {
        afficherMessage("Seuls les passagers peuvent réserver un trajet.");
        return;
      }

      const nombrePlaces = Number(champPlaces.value || 1);
      if (!Number.isFinite(nombrePlaces) || nombrePlaces <= 0) {
        afficherMessage("Nombre de places invalide.");
        return;
      }

      boutonReserver.disabled = true;
      const texteAvant = boutonReserver.textContent;
      boutonReserver.textContent = "Réservation…";

      try {
        const reponse = await createReservation(trajet.id, nombrePlaces);
        afficherMessage(reponse?.message || "Réservation créée.");

        const trajetMisAJour = await getTrajet(trajet.id);
        carte.querySelector("[data-role='places']").textContent = trajetMisAJour.placesRestantes;

        if (trajetMisAJour.placesRestantes <= 0) {
          boutonReserver.disabled = true;
          boutonReserver.textContent = "Complet";
          return;
        }
      } catch (e) {
        afficherMessage(e?.data?.message || e.message || "Erreur réservation.");
        boutonReserver.disabled = false;
        boutonReserver.textContent = texteAvant;
        return;
      }

      boutonReserver.disabled = false;
      boutonReserver.textContent = texteAvant;
    });

    zone.appendChild(carte);
  });
}

// ==========================================================
// CHARGEMENT DES TRAJETS
// ==========================================================

export async function chargerTrajets({
  depart,
  arrivee,
  date,
  ecologique = false,
  prixMax = "",
  dureeMax = "",
  noteMin = ""
}) {
  const zone = document.getElementById("zoneTrajets");
  if (!zone) return;

  try {
    const trajets = await listTrajets();

    // Je filtre d'abord avec la recherche principale
    const trajetsRecherche = trajets.filter((trajet) => {
      return (
        commencePar(trajet.departVille, depart) &&
        commencePar(trajet.arriveeVille, arrivee) &&
        memeDate(trajet.dateDepart, date)
      );
    });

    // Ensuite j'applique les filtres avancés
    const trajetsFiltres = appliquerFiltresAvances(trajetsRecherche, {
      ecologique,
      prixMax,
      dureeMax,
      noteMin
    });

    afficherTrajets(trajetsFiltres);
  } catch (e) {
    afficherMessage(
      e?.data?.message || e.message || "Impossible de charger les trajets."
    );
  }
}