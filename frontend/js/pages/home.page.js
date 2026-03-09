import { listTrajets } from "../api/trajets.js";

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
    const url = `https://api-adresse.data.gouv.fr/search/?q=${texte}&limit=8`;

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

async function initHome() {
    const formulaire = document.getElementById("formulaireRechercheAccueil");
    const boutonVoirTous = document.getElementById("boutonVoirTousAccueil");

    const champDepart = document.getElementById("champDepartAccueil");
    const champArrivee = document.getElementById("champArriveeAccueil");
    const champDate = document.getElementById("champDateAccueil");

    const suggestionsDepart = document.getElementById("suggestionsDepartAccueil");
    const suggestionsArrivee = document.getElementById("suggestionsArriveeAccueil");

    if (!formulaire || !boutonVoirTous || !champDepart || !champArrivee || !champDate) {
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

    formulaire.addEventListener("submit", (event) => {
        event.preventDefault();

        const depart = (champDepart.value || "").trim();
        const arrivee = (champArrivee.value || "").trim();
        const date = (champDate.value || "").trim();

        const params = new URLSearchParams();

        if (depart) params.set("depart", depart);
        if (arrivee) params.set("arrivee", arrivee);
        if (date) params.set("date", date);

        allerVers(`/covoiturages${params.toString() ? "?" + params.toString() : ""}`);
    });

    boutonVoirTous.addEventListener("click", () => {
        allerVers("/covoiturages?all=1");
    });
}

initHome();