// ==========================================================
// PAGE HOME - RECHERCHE + "TOUS LES TRAJETS" + AUTOCOMPLETE
// ==========================================================
// Objectifs :
// - Recherche : redirige vers /covoiturages?depart=...&arrivee=...&date=...
// - Date NON obligatoire
// - Autocomplete (FR) :
//    1) villes de tes trajets (API /api/trajets)
//    2) fallback data.gouv (API Adresse) si pas assez de résultats
//
// Règles UI autocomplete :
// - priorité aux villes qui COMMENCENT par la saisie
// - puis celles qui CONTIENNENT
// - debounce + abort => pas d’appels en boucle
// ==========================================================

import { listTrajets } from "../api/trajets.js";

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function goTo(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new CustomEvent("route:changed"));
}

function normalize(str) {
    return (str || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function uniqueSorted(arr) {
    return Array.from(new Set(arr))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr"));
}

function rankMatches(items, query, max = 8) {
    const q = normalize(query);
    if (!q || q.length < 2) return [];

    const starts = [];
    const contains = [];

    for (const it of items) {
        const n = normalize(it);
        if (n.startsWith(q)) starts.push(it);
        else if (n.includes(q)) contains.push(it);
    }

    return starts.concat(contains).slice(0, max);
}

// ----------------------------------------------------------
// Suggestions UI
// ----------------------------------------------------------

function showSuggestions(container, items, onPick) {
    if (!container) return;

    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.style.display = "none";
        return;
    }

    items.forEach((label) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "list-group-item list-group-item-action";
        btn.textContent = label;
        btn.addEventListener("click", () => onPick(label));
        container.appendChild(btn);
    });

    container.style.display = "";
}

function hideSuggestions(container) {
    if (!container) return;
    container.style.display = "none";
    container.innerHTML = "";
}

// ----------------------------------------------------------
// data.gouv - API Adresse (municipality)
// ----------------------------------------------------------
// On cherche uniquement des communes (villes)
async function fetchCitiesFromDataGouv(query, { signal } = {}) {
    const q = encodeURIComponent(query.trim());
    const url = `https://api-adresse.data.gouv.fr/search/?q=${q}&limit=8&type=municipality`;

    const res = await fetch(url, { signal });
    if (!res.ok) return [];

    const json = await res.json();
    const feats = json?.features || [];

    // On récupère le nom de commune : properties.city
    // (On filtre au cas où)
    const cities = feats
        .map((f) => f?.properties?.city)
        .filter(Boolean);

    return uniqueSorted(cities);
}

// ----------------------------------------------------------
// Autocomplete hybride (trajets -> data.gouv fallback)
// ----------------------------------------------------------

function debounce(fn, delay = 250) {
    let t = null;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

function bindAutocompleteHybrid(input, container, localCities) {
    if (!input || !container) return;

    let abortCtrl = null;

    const run = debounce(async () => {
        const raw = input.value || "";
        const q = raw.trim();

        // Reset si trop court
        if (q.length < 2) {
            hideSuggestions(container);
            if (abortCtrl) abortCtrl.abort();
            return;
        }

        // 1) suggestions locales (trajets)
        const localRanked = rankMatches(localCities, q, 8);

        // Si déjà “assez” de résultats, on affiche direct
        if (localRanked.length >= 4) {
            showSuggestions(container, localRanked, (picked) => {
                input.value = picked;
                hideSuggestions(container);
                input.focus();
            });
            return;
        }

        // 2) fallback data.gouv
        // Annule la requête précédente si elle existe
        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();

        let remoteCities = [];
        try {
            remoteCities = await fetchCitiesFromDataGouv(q, { signal: abortCtrl.signal });
        } catch (e) {
            // Abort => normal, on ignore
            if (e?.name !== "AbortError") remoteCities = [];
        }

        // Merge local + remote (sans doublons), puis ranking
        const merged = uniqueSorted([...localCities, ...remoteCities]);
        const ranked = rankMatches(merged, q, 8);

        showSuggestions(container, ranked, (picked) => {
            input.value = picked;
            hideSuggestions(container);
            input.focus();
        });
    }, 250);

    input.addEventListener("input", run);
    input.addEventListener("focus", run);

    // Click dehors => ferme
    document.addEventListener("click", (e) => {
        if (e.target === input || container.contains(e.target)) return;
        hideSuggestions(container);
    });

    // ESC => ferme
    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") hideSuggestions(container);
    });
}

// ----------------------------------------------------------
// Init page
// ----------------------------------------------------------

export async function initHome() {
    const form = document.getElementById("homeSearchForm");
    const btnAll = document.getElementById("btnAllTrajets");

    const departInput = document.getElementById("depart");
    const arriveeInput = document.getElementById("arrivee");
    const dateInput = document.getElementById("date"); // optionnel

    const departSug = document.getElementById("departSuggestions");
    const arriveeSug = document.getElementById("arriveeSuggestions");

    // Bouton "voir tous les trajets"
    if (btnAll) btnAll.addEventListener("click", () => goTo("/covoiturages"));

    // Charger les villes depuis tes trajets
    let localCities = [];
    try {
        const trajets = await listTrajets();
        const all = [];

        if (Array.isArray(trajets)) {
            for (const t of trajets) {
                if (t?.departVille) all.push(t.departVille);
                if (t?.arriveeVille) all.push(t.arriveeVille);
            }
        }

        localCities = uniqueSorted(all);
    } catch {
        localCities = [];
    }

    // Autocomplete hybride
    bindAutocompleteHybrid(departInput, departSug, localCities);
    bindAutocompleteHybrid(arriveeInput, arriveeSug, localCities);

    // Submit recherche => redirection vers /covoiturages + query params
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const depart = (departInput?.value || "").trim();
            const arrivee = (arriveeInput?.value || "").trim();
            const date = (dateInput?.value || "").trim(); // NON obligatoire

            const params = new URLSearchParams();
            if (depart) params.set("depart", depart);
            if (arrivee) params.set("arrivee", arrivee);
            if (date) params.set("date", date);

            goTo(`/covoiturages${params.toString() ? "?" + params.toString() : ""}`);
        });
    }
}