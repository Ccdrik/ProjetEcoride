import "../ui/covoiturages.js";

function norm(s) {
    return (s || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function startsWithCity(city, typed) {
    if (!typed) return true;
    return norm(city).startsWith(norm(typed));
}

export async function initCovoituragesPage() {
    const root = document.getElementById("trajetsRoot");
    const loading = document.getElementById("loading");

    if (!root) return;

    loading?.classList.remove("d-none");
    root.innerHTML = "";

    try {
        const trajets = await listTrajets();

        //  Lecture des paramètres URL
        const params = new URLSearchParams(window.location.search);
        const departParam = params.get("depart");
        const arriveeParam = params.get("arrivee");
        const dateParam = params.get("date");

        const filtered = trajets.filter((t) => {
            const okDepart = startsWithCity(t.departVille, departParam);
            const okArrivee = startsWithCity(t.arriveeVille, arriveeParam);

            let okDate = true;
            if (dateParam && t.dateDepart) {
                const trajetDate = new Date(t.dateDepart).toISOString().split("T")[0];
                okDate = trajetDate === dateParam;
            }

            return okDepart && okArrivee && okDate;
        });

        if (!filtered.length) {
            root.innerHTML =
                `<div class="alert alert-warning text-center">
          Aucun trajet trouvé pour votre recherche.
        </div>`;
            return;
        }

        root.innerHTML = filtered
            .map((t) => `
        <div class="card mb-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${t.departVille} → ${t.arriveeVille}</h5>
            <div class="text-muted small mb-2">
              Départ : ${new Date(t.dateDepart).toLocaleString("fr-FR")}
            </div>
            <div class="d-flex justify-content-between">
              <div>Places restantes : <strong>${t.placesRestantes}</strong></div>
              <div><strong>${t.prixParPlace} €</strong></div>
            </div>
          </div>
        </div>
      `)
            .join("");

    } catch (err) {
        root.innerHTML =
            `<div class="alert alert-danger text-center">
        Erreur lors du chargement des trajets.
      </div>`;
    } finally {
        loading?.classList.add("d-none");
    }
}