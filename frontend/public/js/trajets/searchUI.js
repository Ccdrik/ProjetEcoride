import { listTrajets } from "../api/trajets.js";

function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

function norm(s) {
    return (s || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(str) {
    return (str ?? "").toString().replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }[c]));
}

async function fetchCommunes(query, signal) {
    const q = norm(query);
    if (q.length < 2) return [];

    const url =
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}` +
        `&fields=nom,codesPostaux,departement&boost=population&limit=10`;

    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();

    // Priorité à "commence par"
    const starts = [];
    const others = [];
    for (const c of data) {
        if (norm(c.nom).startsWith(q)) starts.push(c);
        else others.push(c);
    }
    return [...starts, ...others].slice(0, 8);
}

function mountAutocomplete(inputEl, menuEl) {
    let ac = null;

    const closeMenu = () => {
        menuEl.innerHTML = "";
        menuEl.style.display = "none";
    };

    const openMenu = (items) => {
        if (!items.length) return closeMenu();
        menuEl.style.display = "block";
        menuEl.innerHTML = items
            .map((c, idx) => {
                const cp = (c.codesPostaux && c.codesPostaux[0]) ? ` (${c.codesPostaux[0]})` : "";
                const dep = c.departement?.nom ? ` - ${c.departement.nom}` : "";
                return `
          <button type="button"
                  class="list-group-item list-group-item-action"
                  data-idx="${idx}">
            ${escapeHtml(c.nom)}${escapeHtml(cp)} <small class="text-muted">${escapeHtml(dep)}</small>
          </button>
        `;
            })
            .join("");

        menuEl.querySelectorAll("button[data-idx]").forEach((btn) => {
            btn.addEventListener("click", () => {
                // on garde juste le nom de ville
                inputEl.value = btn.textContent.trim().split("(")[0].trim();
                closeMenu();
                inputEl.dispatchEvent(new Event("change", { bubbles: true }));
            });
        });
    };

    const run = debounce(async () => {
        const q = inputEl.value;
        if (norm(q).length < 2) return closeMenu();

        if (ac) ac.abort();
        ac = new AbortController();

        try {
            const items = await fetchCommunes(q, ac.signal);
            openMenu(items);
        } catch {
            closeMenu();
        }
    }, 250);

    inputEl.addEventListener("input", run);

    document.addEventListener("click", (e) => {
        if (!menuEl.contains(e.target) && e.target !== inputEl) closeMenu();
    });

    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });
}

function renderTrajets(container, trajets) {
    if (!container) return;

    if (!trajets.length) {
        container.innerHTML = `<div class="alert alert-warning">Aucun trajet trouvé.</div>`;
        return;
    }

    container.innerHTML = trajets
        .map((t) => {
            const date = t.dateDepart ? new Date(t.dateDepart) : null;
            const dateTxt = date ? date.toLocaleString("fr-FR") : "—";

            return `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title mb-1">${escapeHtml(t.departVille)} → ${escapeHtml(t.arriveeVille)}</h5>
            <div class="text-muted small mb-2">Départ : ${escapeHtml(dateTxt)}</div>
            <div class="d-flex justify-content-between">
              <div>Places restantes : <strong>${escapeHtml(t.placesRestantes)}</strong></div>
              <div><strong>${escapeHtml(t.prixParPlace)} €</strong></div>
            </div>
          </div>
        </div>
      `;
        })
        .join("");
}

function startsWithCity(city, typed) {
    const c = norm(city);
    const t = norm(typed);
    if (!t) return true;
    return c.startsWith(t);
}

async function loadAll(resultsEl) {
    resultsEl.innerHTML = `<div class="text-muted">Chargement…</div>`;
    const trajets = await listTrajets();
    renderTrajets(resultsEl, trajets);
}

async function search(resultsEl, depart, arrivee) {
    resultsEl.innerHTML = `<div class="text-muted">Recherche…</div>`;
    const trajets = await listTrajets();

    const filtered = trajets.filter((t) => {
        return (
            startsWithCity(t.departVille, depart) &&
            startsWithCity(t.arriveeVille, arrivee)
        );
    });

    renderTrajets(resultsEl, filtered);
}

export function initTrajetSearchUI() {
    const form = document.getElementById("homeSearchForm");
    const depart = document.getElementById("depart");
    const arrivee = document.getElementById("arrivee");
    const departSug = document.getElementById("departSuggestions");
    const arriveeSug = document.getElementById("arriveeSuggestions");
    const btnAll = document.getElementById("btnAllTrajets");

    // On n'a pas besoin de results sur Home si on redirige vers /covoiturages
    if (!form || !depart || !arrivee || !departSug || !arriveeSug) return;

    // Evite de binder 2 fois si init appelée plusieurs fois
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    mountAutocomplete(depart, departSug);
    mountAutocomplete(arrivee, arriveeSug);

    // Rechercher (submit du form) => redirection SPA vers /covoiturages
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const d = depart.value.trim();
        const a = arrivee.value.trim();
        const dateValue = document.getElementById("date")?.value || "";

        const params = new URLSearchParams();
        if (d) params.append("depart", d);
        if (a) params.append("arrivee", a);
        if (dateValue) params.append("date", dateValue);

        const url = params.toString() ? `/covoiturages?${params.toString()}` : "/covoiturages";

        window.history.pushState({}, "", url);
        window.dispatchEvent(new Event("popstate"));
    });

    // Voir tous => /covoiturages sans filtres
    if (btnAll) {
        btnAll.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, "", "/covoiturages");
            window.dispatchEvent(new Event("popstate"));
        });
    }
}