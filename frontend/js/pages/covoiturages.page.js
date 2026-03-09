import { chargerTrajets } from "../ui/covoiturages.js";

// ==========================================================
// PAGE COVOITURAGES
// - je lis les paramètres dans l'URL
// - je remplis le formulaire avec ces valeurs
// - je relance la recherche quand on soumet
// - je gère aussi les filtres et le bouton voir tous
// ==========================================================

function recupererParametresUrl() {
    const params = new URLSearchParams(window.location.search);

    return {
        depart: params.get("depart") || "",
        arrivee: params.get("arrivee") || "",
        date: params.get("date") || "",
        afficherTous: params.get("all") === "1",

        ecologique: params.get("eco") === "1",
        prixMax: params.get("prixMax") || "",
        dureeMax: params.get("dureeMax") || "",
        noteMin: params.get("noteMin") || ""
    };
}

function mettreAJourUrl({
    depart,
    arrivee,
    date,
    afficherTous = false,
    ecologique = false,
    prixMax = "",
    dureeMax = "",
    noteMin = ""
}) {
    const params = new URLSearchParams();

    if (depart) params.set("depart", depart);
    if (arrivee) params.set("arrivee", arrivee);
    if (date) params.set("date", date);
    if (afficherTous) params.set("all", "1");

    if (ecologique) params.set("eco", "1");
    if (prixMax) params.set("prixMax", prixMax);
    if (dureeMax) params.set("dureeMax", dureeMax);
    if (noteMin) params.set("noteMin", noteMin);

    const nouvelleUrl = `/covoiturages${params.toString() ? "?" + params.toString() : ""}`;

    window.history.pushState({}, "", nouvelleUrl);

    // Je relance l'initialisation pour recharger les trajets
    initCovoituragesPage();
}

function remplirFormulaireAvecUrl({
    parametres,
    champDepart,
    champArrivee,
    champDate,
    filtreEcologique,
    filtrePrixMax,
    filtreDureeMax,
    filtreNoteMin
}) {
    champDepart.value = parametres.depart;
    champArrivee.value = parametres.arrivee;
    champDate.value = parametres.date;

    if (filtreEcologique) filtreEcologique.checked = parametres.ecologique;
    if (filtrePrixMax) filtrePrixMax.value = parametres.prixMax;
    if (filtreDureeMax) filtreDureeMax.value = parametres.dureeMax;
    if (filtreNoteMin) filtreNoteMin.value = parametres.noteMin;
}

function viderFormulaire({
    champDepart,
    champArrivee,
    champDate,
    filtreEcologique,
    filtrePrixMax,
    filtreDureeMax,
    filtreNoteMin
}) {
    champDepart.value = "";
    champArrivee.value = "";
    champDate.value = "";

    if (filtreEcologique) filtreEcologique.checked = false;
    if (filtrePrixMax) filtrePrixMax.value = "";
    if (filtreDureeMax) filtreDureeMax.value = "";
    if (filtreNoteMin) filtreNoteMin.value = "";
}

async function lancerChargementTrajets({
    zoneChargement,
    depart,
    arrivee,
    date,
    ecologique,
    prixMax,
    dureeMax,
    noteMin
}) {
    if (zoneChargement) zoneChargement.classList.remove("d-none");

    try {
        await chargerTrajets({
            depart,
            arrivee,
            date,
            ecologique,
            prixMax,
            dureeMax,
            noteMin
        });
    } finally {
        if (zoneChargement) zoneChargement.classList.add("d-none");
    }
}

export async function initCovoituragesPage() {
    const zoneTrajets = document.getElementById("zoneTrajets");
    const zoneChargement = document.getElementById("zoneChargementCovoiturages");
    const texteAide = document.getElementById("texteAideCovoiturages");

    const formulaire = document.getElementById("formulaireRechercheCovoiturages");
    const champDepart = document.getElementById("champDepartCovoiturages");
    const champArrivee = document.getElementById("champArriveeCovoiturages");
    const champDate = document.getElementById("champDateCovoiturages");

    const filtreEcologique = document.getElementById("filtreEcologique");
    const filtrePrixMax = document.getElementById("filtrePrixMax");
    const filtreDureeMax = document.getElementById("filtreDureeMax");
    const filtreNoteMin = document.getElementById("filtreNoteMin");

    const boutonFiltres = document.getElementById("boutonAppliquerFiltres");
    const boutonVoirTous = document.getElementById("boutonVoirTousCovoiturages");
    const boutonReinitialiser = document.getElementById("boutonReinitialiserCovoiturages");

    if (!zoneTrajets || !formulaire || !champDepart || !champArrivee || !champDate) {
        return;
    }

    const parametres = recupererParametresUrl();

    remplirFormulaireAvecUrl({
        parametres,
        champDepart,
        champArrivee,
        champDate,
        filtreEcologique,
        filtrePrixMax,
        filtreDureeMax,
        filtreNoteMin
    });

    // J'attache les événements une seule fois
    if (!formulaire.dataset.evenementsAjoutes) {
        formulaire.dataset.evenementsAjoutes = "1";

        formulaire.addEventListener("submit", (event) => {
            event.preventDefault();

            mettreAJourUrl({
                depart: champDepart.value.trim(),
                arrivee: champArrivee.value.trim(),
                date: champDate.value,
                afficherTous: false,
                ecologique: filtreEcologique?.checked || false,
                prixMax: filtrePrixMax?.value || "",
                dureeMax: filtreDureeMax?.value || "",
                noteMin: filtreNoteMin?.value || ""
            });
        });

        boutonFiltres?.addEventListener("click", () => {
            const paramsActuels = recupererParametresUrl();

            mettreAJourUrl({
                depart: champDepart.value.trim(),
                arrivee: champArrivee.value.trim(),
                date: champDate.value,
                afficherTous: paramsActuels.afficherTous,
                ecologique: filtreEcologique?.checked || false,
                prixMax: filtrePrixMax?.value || "",
                dureeMax: filtreDureeMax?.value || "",
                noteMin: filtreNoteMin?.value || ""
            });
        });

        boutonVoirTous?.addEventListener("click", () => {
            mettreAJourUrl({
                depart: "",
                arrivee: "",
                date: "",
                afficherTous: true,
                ecologique: filtreEcologique?.checked || false,
                prixMax: filtrePrixMax?.value || "",
                dureeMax: filtreDureeMax?.value || "",
                noteMin: filtreNoteMin?.value || ""
            });
        });

        boutonReinitialiser?.addEventListener("click", () => {
            viderFormulaire({
                champDepart,
                champArrivee,
                champDate,
                filtreEcologique,
                filtrePrixMax,
                filtreDureeMax,
                filtreNoteMin
            });

            mettreAJourUrl({
                depart: "",
                arrivee: "",
                date: "",
                afficherTous: false,
                ecologique: false,
                prixMax: "",
                dureeMax: "",
                noteMin: ""
            });
        });
    }

    const rechercheComplete = !!(parametres.depart && parametres.arrivee && parametres.date);
    const afficherTous = parametres.afficherTous;

    if (texteAide) {
        texteAide.classList.toggle("d-none", rechercheComplete || afficherTous);
    }

    if (zoneTrajets) {
        zoneTrajets.classList.toggle("d-none", !(rechercheComplete || afficherTous));
    }

    if (!(rechercheComplete || afficherTous)) return;

    await lancerChargementTrajets({
        zoneChargement,
        depart: parametres.depart,
        arrivee: parametres.arrivee,
        date: parametres.date,
        ecologique: parametres.ecologique,
        prixMax: parametres.prixMax,
        dureeMax: parametres.dureeMax,
        noteMin: parametres.noteMin
    });
}