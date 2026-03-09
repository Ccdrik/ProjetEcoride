import { chargerTrajets } from "../ui/covoiturages.js";
import { listTrajets } from "../api/trajets.js";

function normaliserTexte(texte) {
    return (texte || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function listeUniqueTriee(tableau) {
    return Array.from(new Set(tableau))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));
}

function classerCorrespondances(elements, recherche, max = 8) {
    const texteRecherche = normaliserTexte(recherche);
    if (!texteRecherche || texteRecherche.length < 2) return [];

    const commencePar = [];
    const contient = [];

    for (const element of elements) {
        const texteNormalise = normaliserTexte(element);

        if (texteNormalise.startsWith(texteRecherche)) {
            commencePar.push(element);
        } else if (texteNormalise.includes(texteRecherche)) {
            contient.push(element);
        }
    }

    return commencePar.concat(contient).slice(0, max);
}

function afficherSuggestions(zoneSuggestions, elements, auChoix) {
    if (!zoneSuggestions) return;

    zoneSuggestions.innerHTML = "";

    if (!elements || elements.length === 0) {
        zoneSuggestions.style.display = "none";
        return;
    }

    elements.forEach((element) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "list-group-item list-group-item-action";
        bouton.textContent = element;

        bouton.addEventListener("click", () => {
            auChoix(element);
        });

        zoneSuggestions.appendChild(bouton);
    });

    zoneSuggestions.style.display = "";
}

function masquerSuggestions(zoneSuggestions) {
    if (!zoneSuggestions) return;
    zoneSuggestions.innerHTML = "";
    zoneSuggestions.style.display = "none";
}

function debounce(fonction, delai = 250) {
    let timer = null;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fonction(...args), delai);
    };
}

async function recupererVillesDepuisDataGouv(recherche, { signal } = {}) {
    const texte = encodeURIComponent(recherche.trim());
    const url = `https://api-adresse.data.gouv.fr/search/?q=${texte}&limit=8&type=municipality`;

    const reponse = await fetch(url, { signal });
    if (!reponse.ok) return [];

    const json = await reponse.json();
    const villes = (json?.features || [])
        .map((element) => element?.properties?.city)
        .filter(Boolean);

    return listeUniqueTriee(villes);
}

function activerAutocomplete(champ, zoneSuggestions, villesLocales) {
    if (!champ || !zoneSuggestions) return;

    let controleurAnnulation = null;

    const lancerRecherche = debounce(async () => {
        const texte = (champ.value || "").trim();

        if (texte.length < 2) {
            masquerSuggestions(zoneSuggestions);
            if (controleurAnnulation) controleurAnnulation.abort();
            return;
        }

        const resultatsLocaux = classerCorrespondances(villesLocales, texte, 8);

        if (resultatsLocaux.length >= 4) {
            afficherSuggestions(zoneSuggestions, resultatsLocaux, (valeurChoisie) => {
                champ.value = valeurChoisie;
                masquerSuggestions(zoneSuggestions);
                champ.focus();
            });
            return;
        }

        if (controleurAnnulation) controleurAnnulation.abort();
        controleurAnnulation = new AbortController();

        let resultatsDataGouv = [];
        try {
            resultatsDataGouv = await recupererVillesDepuisDataGouv(texte, {
                signal: controleurAnnulation.signal
            });
        } catch (e) {
            if (e?.name !== "AbortError") {
                resultatsDataGouv = [];
            }
        }

        const listeFusionnee = listeUniqueTriee([...villesLocales, ...resultatsDataGouv]);
        const resultatsFinaux = classerCorrespondances(listeFusionnee, texte, 8);

        afficherSuggestions(zoneSuggestions, resultatsFinaux, (valeurChoisie) => {
            champ.value = valeurChoisie;
            masquerSuggestions(zoneSuggestions);
            champ.focus();
        });
    }, 250);

    champ.addEventListener("input", lancerRecherche);
    champ.addEventListener("focus", lancerRecherche);

    document.addEventListener("click", (event) => {
        if (event.target === champ || zoneSuggestions.contains(event.target)) return;
        masquerSuggestions(zoneSuggestions);
    });

    champ.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            masquerSuggestions(zoneSuggestions);
        }
    });
}

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

async function initCovoituragesPage() {
    const zoneTrajets = document.getElementById("zoneTrajets");
    const zoneChargement = document.getElementById("zoneChargementCovoiturages");
    const texteAide = document.getElementById("texteAideCovoiturages");

    const formulaire = document.getElementById("formulaireRechercheCovoiturages");
    const champDepart = document.getElementById("champDepartCovoiturages");
    const champArrivee = document.getElementById("champArriveeCovoiturages");
    const champDate = document.getElementById("champDateCovoiturages");

    const suggestionsDepart = document.getElementById("suggestionsDepartCovoiturages");
    const suggestionsArrivee = document.getElementById("suggestionsArriveeCovoiturages");

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

    let villesLocales = [];

    try {
        const trajets = await listTrajets();
        const toutesLesVilles = [];

        if (Array.isArray(trajets)) {
            for (const trajet of trajets) {
                if (trajet?.departVille) toutesLesVilles.push(trajet.departVille);
                if (trajet?.arriveeVille) toutesLesVilles.push(trajet.arriveeVille);
            }
        }

        villesLocales = listeUniqueTriee(toutesLesVilles);
    } catch {
        villesLocales = [];
    }

    activerAutocomplete(champDepart, suggestionsDepart, villesLocales);
    activerAutocomplete(champArrivee, suggestionsArrivee, villesLocales);

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

initCovoituragesPage();