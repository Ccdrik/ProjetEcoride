import { apiFetch } from "../api/client.js";

console.log("modifier-trajet.page.js chargé");

let vehiculesChauffeur = [];
let trajetCharge = null;

function getTrajetIdDepuisUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function formaterDatePourInput(dateIso) {
    if (!dateIso) return "";

    const date = new Date(dateIso);
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function remplirFormulaire(trajet) {
    const departEl = document.getElementById("departVille");
    const arriveeEl = document.getElementById("arriveeVille");
    const dateEl = document.getElementById("dateDepart");
    const prixEl = document.getElementById("prixParPlace");
    const placesEl = document.getElementById("placesTotal");

    if (departEl) departEl.value = trajet.departVille ?? "";
    if (arriveeEl) arriveeEl.value = trajet.arriveeVille ?? "";
    if (dateEl) dateEl.value = formaterDatePourInput(trajet.dateDepart);
    if (prixEl) prixEl.value = trajet.prixParPlace ?? "";
    if (placesEl) placesEl.value = trajet.placesTotal ?? "";
}

async function chargerVehicules() {
    const vehiculeSelect = document.getElementById("vehiculeId");
    if (!vehiculeSelect) return;

    try {
        vehiculesChauffeur = await apiFetch("/api/me/vehicules");

        vehiculeSelect.innerHTML = `
            <option value="" selected disabled>Choisissez un véhicule</option>
        `;

        if (!Array.isArray(vehiculesChauffeur) || vehiculesChauffeur.length === 0) {
            vehiculeSelect.innerHTML = `
                <option value="" disabled>Aucun véhicule disponible</option>
            `;
            return;
        }

        vehiculesChauffeur.forEach((vehicule) => {
            const option = document.createElement("option");
            option.value = vehicule.id;
            option.textContent = `${vehicule.marque} ${vehicule.modele} - ${vehicule.energie}`;
            vehiculeSelect.appendChild(option);
        });
    } catch (e) {
        console.error(e);
        alert("Impossible de charger vos véhicules.");
    }
}

function selectionnerVehiculeDuTrajet(trajet) {
    const vehiculeSelect = document.getElementById("vehiculeId");
    if (!vehiculeSelect || !trajet?.vehicule?.id) return;

    vehiculeSelect.value = String(trajet.vehicule.id);
}

async function chargerTrajet() {
    const trajetId = getTrajetIdDepuisUrl();
    if (!trajetId) {
        alert("Trajet introuvable.");
        return null;
    }

    try {
        const trajet = await apiFetch(`/api/trajets/${trajetId}`);
        trajetCharge = trajet;
        remplirFormulaire(trajet);
        selectionnerVehiculeDuTrajet(trajet);
        return trajet;
    } catch (e) {
        console.error(e);
        alert(e.message || "Impossible de charger le trajet.");
        return null;
    }
}

async function modifierTrajet(trajetId, data) {
    return apiFetch(`/api/trajets/${trajetId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
}

async function initPage() {
    const form = document.getElementById("formModifierTrajet");
    if (!form) return;

    const trajetId = getTrajetIdDepuisUrl();
    if (!trajetId) {
        alert("Identifiant du trajet manquant.");
        return;
    }

    await chargerVehicules();
    await chargerTrajet();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const departVille = document.getElementById("departVille")?.value.trim() ?? "";
        const arriveeVille = document.getElementById("arriveeVille")?.value.trim() ?? "";
        const dateDepart = document.getElementById("dateDepart")?.value ?? "";
        const prixParPlace = parseInt(document.getElementById("prixParPlace")?.value ?? "0", 10);
        const placesTotal = parseInt(document.getElementById("placesTotal")?.value ?? "0", 10);
        const vehiculeId = parseInt(document.getElementById("vehiculeId")?.value ?? "0", 10);

        if (!departVille || !arriveeVille || !dateDepart || Number.isNaN(prixParPlace) || Number.isNaN(placesTotal) || Number.isNaN(vehiculeId) || vehiculeId <= 0) {
            alert("Tous les champs sont obligatoires.");
            return;
        }

        const data = {
            departVille,
            arriveeVille,
            dateDepart,
            prixParPlace,
            placesTotal,
            vehiculeId
        };

        try {
            await modifierTrajet(trajetId, data);
            alert("Trajet modifié.");
            window.history.pushState({}, "", "/mes-trajets");
            window.dispatchEvent(new Event("popstate"));
        } catch (e) {
            console.error(e);
            alert(e.message || "Impossible de modifier le trajet.");
        }
    });
}

initPage();