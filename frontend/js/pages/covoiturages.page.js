import { chargerTrajets } from "../ui/covoiturages.js";

// Je récupère les paramètres dans l'URL
function recupererParametresUrl() {
    const params = new URLSearchParams(window.location.search);

    return {
        depart: params.get("depart") || "",
        arrivee: params.get("arrivee") || "",
        date: params.get("date") || "",
        afficherTous: params.get("all") === "1",

        // Filtres
        ecoOnly: params.get("ecoOnly") === "1",
        prixMax: params.get("prixMax") || "",
        dureeMax: params.get("dureeMax") || "",
        noteMin: params.get("noteMin") || "",
    };
}

// Je mets à jour l'URL avec les valeurs du formulaire
function mettreAJourUrl({
    depart,
    arrivee,
    date,
    afficherTous = false,
    ecoOnly = false,
    prixMax = "",
    dureeMax = "",
    noteMin = "",
}) {
    const params = new URLSearchParams();

    if (depart) params.set("depart", depart);
    if (arrivee) params.set("arrivee", arrivee);
    if (date) params.set("date", date);
    if (afficherTous) params.set("all", "1");

    if (ecoOnly) params.set("ecoOnly", "1");
    if (prixMax) params.set("prixMax", prixMax);
    if (dureeMax) params.set("dureeMax", dureeMax);
    if (noteMin) params.set("noteMin", noteMin);

    const queryString = params.toString();
    const nouvelleUrl = queryString ? `/covoiturages?${queryString}` : `/covoiturages`;

    window.history.pushState({}, "", nouvelleUrl);

    // Je relance la page pour afficher les résultats
    initialiserPageCovoiturages();
}

// Cette fonction vide tous les champs du formulaire
function viderFormulaire({
    champDepart,
    champArrivee,
    champDate,
    filtreEco,
    filtrePrixMax,
    filtreDureeMax,
    filtreNoteMin,
}) {
    champDepart.value = "";
    champArrivee.value = "";
    champDate.value = "";

    if (filtreEco) filtreEco.checked = false;
    if (filtrePrixMax) filtrePrixMax.value = "";
    if (filtreDureeMax) filtreDureeMax.value = "";
    if (filtreNoteMin) filtreNoteMin.value = "";
}

// Cette fonction met les valeurs de l'URL dans le formulaire
function remplirFormulaireAvecUrl({
    parametres,
    champDepart,
    champArrivee,
    champDate,
    filtreEco,
    filtrePrixMax,
    filtreDureeMax,
    filtreNoteMin,
}) {
    champDepart.value = parametres.depart;
    champArrivee.value = parametres.arrivee;
    champDate.value = parametres.date;

    if (filtreEco) filtreEco.checked = parametres.ecoOnly;
    if (filtrePrixMax) filtrePrixMax.value = parametres.prixMax;
    if (filtreDureeMax) filtreDureeMax.value = parametres.dureeMax;
    if (filtreNoteMin) filtreNoteMin.value = parametres.noteMin;
}

// Cette fonction lance le chargement des trajets
async function lancerChargementTrajets({
    zoneChargement,
    depart,
    arrivee,
    date,
    ecoOnly,
    prixMax,
    dureeMax,
    noteMin,
}) {
    if (zoneChargement) zoneChargement.classList.remove("d-none");

    try {
        await chargerTrajets({
            depart,
            arrivee,
            date,
            ecoOnly,
            prixMax,
            dureeMax,
            noteMin,
        });
    } finally {
        if (zoneChargement) zoneChargement.classList.add("d-none");
    }
}

// Fonction principale de la page
export async function initialiserPageCovoiturages() {
    const zoneTrajets = document.getElementById("trajetsRoot");
    const zoneChargement = document.getElementById("loading");
    const texteAide = document.getElementById("hint");

    const formulaire = document.getElementById("searchForm");
    const champDepart = document.getElementById("departInput");
    const champArrivee = document.getElementById("arriveeInput");
    const champDate = document.getElementById("dateInput");
    const boutonReset = document.getElementById("resetBtn");

    // Filtres
    const filtreEco = document.getElementById("ecoOnly");
    const filtrePrixMax = document.getElementById("prixMax");
    const filtreDureeMax = document.getElementById("dureeMax");
    const filtreNoteMin = document.getElementById("noteMin");
    const boutonAppliquerFiltres = document.getElementById("applyFiltersBtn");
    const boutonVoirTous = document.getElementById("seeAllBtn");

    if (!zoneTrajets || !formulaire || !champDepart || !champArrivee || !champDate) return;

    const parametres = recupererParametresUrl();

    remplirFormulaireAvecUrl({
        parametres,
        champDepart,
        champArrivee,
        champDate,
        filtreEco,
        filtrePrixMax,
        filtreDureeMax,
        filtreNoteMin,
    });

    // J'ajoute les événements une seule fois
    if (!formulaire.dataset.evenementsAjoutes) {
        formulaire.dataset.evenementsAjoutes = "1";

        // Recherche classique
        formulaire.addEventListener("submit", (event) => {
            event.preventDefault();

            const depart = champDepart.value.trim();
            const arrivee = champArrivee.value.trim();
            const date = champDate.value;

            // Je garde les 3 champs obligatoires pour une recherche normale
            if (!depart || !arrivee || !date) return;

            mettreAJourUrl({
                depart,
                arrivee,
                date,
                afficherTous: false,
                ecoOnly: filtreEco?.checked || false,
                prixMax: filtrePrixMax?.value || "",
                dureeMax: filtreDureeMax?.value || "",
                noteMin: filtreNoteMin?.value || "",
            });
        });

        // Réinitialisation
        boutonReset?.addEventListener("click", () => {
            viderFormulaire({
                champDepart,
                champArrivee,
                champDate,
                filtreEco,
                filtrePrixMax,
                filtreDureeMax,
                filtreNoteMin,
            });

            mettreAJourUrl({
                depart: "",
                arrivee: "",
                date: "",
                afficherTous: false,
                ecoOnly: false,
                prixMax: "",
                dureeMax: "",
                noteMin: "",
            });
        });

        // Appliquer uniquement les filtres
        boutonAppliquerFiltres?.addEventListener("click", () => {
            mettreAJourUrl({
                depart: champDepart.value.trim(),
                arrivee: champArrivee.value.trim(),
                date: champDate.value,
                afficherTous: recupererParametresUrl().afficherTous,
                ecoOnly: filtreEco?.checked || false,
                prixMax: filtrePrixMax?.value || "",
                dureeMax: filtreDureeMax?.value || "",
                noteMin: filtreNoteMin?.value || "",
            });
        });

        // Voir tous les trajets
        boutonVoirTous?.addEventListener("click", () => {
            mettreAJourUrl({
                depart: "",
                arrivee: "",
                date: "",
                afficherTous: true,
                ecoOnly: filtreEco?.checked || false,
                prixMax: filtrePrixMax?.value || "",
                dureeMax: filtreDureeMax?.value || "",
                noteMin: filtreNoteMin?.value || "",
            });
        });
    }

    // Cas 1 : vraie recherche
    const rechercheComplete = !!(parametres.depart && parametres.arrivee && parametres.date);

    // Cas 2 : clic sur voir tous
    const afficherTous = parametres.afficherTous;

    if (texteAide) texteAide.classList.toggle("d-none", rechercheComplete || afficherTous);
    if (zoneTrajets) zoneTrajets.classList.toggle("d-none", !(rechercheComplete || afficherTous));

    if (!(rechercheComplete || afficherTous)) return;

    await lancerChargementTrajets({
        zoneChargement,
        depart: parametres.depart,
        arrivee: parametres.arrivee,
        date: parametres.date,
        ecoOnly: parametres.ecoOnly,
        prixMax: parametres.prixMax,
        dureeMax: parametres.dureeMax,
        noteMin: parametres.noteMin,
    });
}