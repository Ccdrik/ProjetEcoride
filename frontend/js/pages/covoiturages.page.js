import { chargerTrajets } from "../ui/covoiturages.js";

/*
  Ce fichier gère la page /covoiturages.

  - Je lis les infos dans l’URL (depart, arrivee, date)
  - Je gère le formulaire de recherche
  - Si la recherche n’est pas complète, je n’affiche pas la liste
  - Si elle est complète, je demande à l’UI de charger les trajets
*/

function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        depart: params.get("depart") || "",
        arrivee: params.get("arrivee") || "",
        date: params.get("date") || "",
    };
}

function setParams({ depart, arrivee, date }) {
    const params = new URLSearchParams();
    params.set("depart", depart);
    params.set("arrivee", arrivee);
    params.set("date", date);

    const newUrl = `/covoiturages?${params.toString()}`;
    window.history.pushState({}, "", newUrl);

    initCovoituragesPage();
}

export async function initCovoituragesPage() {
    const root = document.getElementById("trajetsRoot");
    const loading = document.getElementById("loading");
    const hint = document.getElementById("hint");

    const form = document.getElementById("searchForm");
    const departInput = document.getElementById("departInput");
    const arriveeInput = document.getElementById("arriveeInput");
    const dateInput = document.getElementById("dateInput");
    const resetBtn = document.getElementById("resetBtn");

    if (!root || !form || !departInput || !arriveeInput || !dateInput) return;

    // Je pré-remplis le formulaire avec ce qu’il y a déjà dans l’URL
    const { depart, arrivee, date } = getParams();
    departInput.value = depart;
    arriveeInput.value = arrivee;
    dateInput.value = date;

    // J’attache les events une seule fois (sinon en SPA ça double)
    if (!form.dataset.bound) {
        form.dataset.bound = "1";

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const d = departInput.value.trim();
            const a = arriveeInput.value.trim();
            const dt = dateInput.value;

            // Départ + arrivée + date obligatoires
            if (!d || !a || !dt) return;

            setParams({ depart: d, arrivee: a, date: dt });
        });

        resetBtn?.addEventListener("click", () => {
            window.history.pushState({}, "", "/covoiturages");
            initCovoituragesPage();
        });
    }

    // Je nettoie l’écran
    root.innerHTML = "";
    loading?.classList.add("d-none");

    // Si recherche incomplète : j’affiche juste le message d’aide
    if (!depart || !arrivee || !date) {
        hint?.classList.remove("d-none");
        return;
    }

    // Sinon je charge les trajets
    hint?.classList.add("d-none");
    loading?.classList.remove("d-none");

    try {
        await chargerTrajets({ depart, arrivee, date });
    } finally {
        loading?.classList.add("d-none");
    }
}

// Petit bonus SPA : si tu reviens sur la page, je relance l’init
window.addEventListener("route:changed", (e) => {
    const url = e?.detail?.url || window.location.pathname;
    if (url === "/covoiturages") {
        initCovoituragesPage();
    }
});

// Si on arrive directement sur /covoiturages
if (window.location.pathname === "/covoiturages") {
    initCovoituragesPage();
}