import { apiFetch, getToken } from "../api/client.js";

console.log("creer-trajet.page.js chargé");

// ==========================================================
// Helpers affichage message
// ==========================================================
function afficherMessage(message, type = "danger") {
    const zone = document.getElementById("message-trajet");
    if (!zone) return;

    zone.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function nettoyerMessage() {
    const zone = document.getElementById("message-trajet");
    if (!zone) return;
    zone.innerHTML = "";
}

// ==========================================================
// Autocomplete villes via API adresse.data.gouv.fr
// ==========================================================
async function rechercherVilles(query) {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(
            `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5`
        );

        const data = await response.json();
        return data.features || [];
    } catch (error) {
        console.error("Erreur autocomplete villes :", error);
        return [];
    }
}

function creerListeSuggestions(input) {
    const liste = document.createElement("div");
    liste.className = "autocomplete-list list-group position-absolute w-100";
    liste.style.zIndex = "1000";
    input.parentElement.style.position = "relative";
    input.parentElement.appendChild(liste);
    return liste;
}

function brancherAutocomplete(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const liste = creerListeSuggestions(input);

    input.addEventListener("input", async () => {
        const query = input.value.trim();
        liste.innerHTML = "";

        const villes = await rechercherVilles(query);

        villes.forEach((ville) => {
            const nomVille = ville.properties.city;
            if (!nomVille) return;

            const item = document.createElement("button");
            item.type = "button";
            item.className = "list-group-item list-group-item-action";
            item.textContent = nomVille;

            item.addEventListener("click", () => {
                input.value = nomVille;
                liste.innerHTML = "";
            });

            liste.appendChild(item);
        });
    });

    document.addEventListener("click", (e) => {
        if (!input.parentElement.contains(e.target)) {
            liste.innerHTML = "";
        }
    });
}

// ==========================================================
// Création trajet
// ==========================================================
function initialiserFormulaire() {
    const form = document.getElementById("creer-trajet-form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        nettoyerMessage();

        if (!getToken()) {
            afficherMessage("Vous devez être connecté en tant que chauffeur.");
            return;
        }

        const depart = document.getElementById("depart")?.value.trim();
        const arrivee = document.getElementById("arrivee")?.value.trim();
        const date = document.getElementById("date")?.value;
        const heure = document.getElementById("heure")?.value;
        const places = document.getElementById("places")?.value;
        const prix = document.getElementById("prix")?.value;

        if (!depart || !arrivee || !date || !heure || !places || !prix) {
            afficherMessage("Tous les champs obligatoires doivent être remplis.");
            return;
        }

        const dateDepart = `${date}T${heure}:00`;

        const payload = {
            departVille: depart,
            arriveeVille: arrivee,
            dateDepart,
            prixParPlace: Number(prix),
            placesTotal: Number(places)
        };

        try {
            const resultat = await apiFetch("/api/trajets", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            afficherMessage("Trajet créé avec succès.", "success");
            console.log("Trajet créé :", resultat);

            form.reset();

            setTimeout(() => {
                window.history.pushState({}, "", "/covoiturages");
                window.dispatchEvent(new Event("popstate"));
            }, 1000);
        } catch (error) {
            console.error(error);
            afficherMessage(error?.data?.message || "Impossible de créer le trajet.");
        }
    });
}

// ==========================================================
// Init page
// ==========================================================
brancherAutocomplete("depart");
brancherAutocomplete("arrivee");
initialiserFormulaire();