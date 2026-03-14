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
// Validation visuelle
// ==========================================================
function setFieldState(input, isValid) {
    if (!input) return;

    input.classList.remove("is-valid", "is-invalid");

    if (isValid === true) {
        input.classList.add("is-valid");
    } else if (isValid === false) {
        input.classList.add("is-invalid");
    }
}

function validateRequiredText(input) {
    const value = input?.value?.trim() || "";

    if (!value) {
        setFieldState(input, false);
        return false;
    }

    setFieldState(input, true);
    return true;
}

function validateRequiredNumber(input, min = 1) {
    const value = Number(input?.value);

    if (!input?.value || Number.isNaN(value) || value < min) {
        setFieldState(input, false);
        return false;
    }

    setFieldState(input, true);
    return true;
}

function validateRequiredDateTime(input) {
    const value = input?.value || "";

    if (!value) {
        setFieldState(input, false);
        return false;
    }

    setFieldState(input, true);
    return true;
}

function validateRequiredSelect(input) {
    const value = input?.value || "";

    if (!value) {
        setFieldState(input, false);
        return false;
    }

    setFieldState(input, true);
    return true;
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

function brancherAutocomplete(inputId, listeId) {
    const input = document.getElementById(inputId);
    const liste = document.getElementById(listeId);

    if (!input || !liste) return;

    input.addEventListener("input", async () => {
        const query = input.value.trim();
        liste.innerHTML = "";
        liste.style.display = "none";

        if (query.length < 2) return;

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
                liste.style.display = "none";
                setFieldState(input, true);
            });

            liste.appendChild(item);
        });

        if (liste.children.length > 0) {
            liste.style.display = "block";
        }
    });

    document.addEventListener("click", (e) => {
        if (!input.parentElement.contains(e.target)) {
            liste.innerHTML = "";
            liste.style.display = "none";
        }
    });
}

// ==========================================================
// Véhicules du chauffeur
// ==========================================================
let vehiculesChauffeur = [];

function estVehiculeEcologique(energie) {
    const valeur = (energie || "").toLowerCase().trim();

    return ["electrique", "électrique", "hybride"].includes(valeur);
}

function mettreAJourBlocEcologique() {
    const selectVehicule = document.getElementById("vehiculeId");
    const checkbox = document.getElementById("trajetEcologique");
    const texte = document.getElementById("texteTrajetEcologique");

    if (!selectVehicule || !checkbox || !texte) return;

    const vehiculeSelectionne = vehiculesChauffeur.find(
        (v) => String(v.id) === String(selectVehicule.value)
    );

    if (!vehiculeSelectionne) {
        checkbox.checked = false;
        texte.textContent = "Trajet écologique selon le véhicule sélectionné";
        return;
    }

    const ecologique = estVehiculeEcologique(vehiculeSelectionne.energie);
    checkbox.checked = ecologique;

    texte.textContent = ecologique
        ? "Trajet écologique"
        : "Trajet non écologique";
}

async function chargerVehicules() {
    const selectVehicule = document.getElementById("vehiculeId");
    if (!selectVehicule) return;

    try {
        vehiculesChauffeur = await apiFetch("/api/me/vehicules");

        selectVehicule.innerHTML = `
            <option value="" selected disabled>Choisissez un véhicule</option>
        `;

        if (!Array.isArray(vehiculesChauffeur) || vehiculesChauffeur.length === 0) {
            selectVehicule.innerHTML += `
                <option value="" disabled>Aucun véhicule disponible</option>
            `;
            return;
        }

        vehiculesChauffeur.forEach((vehicule) => {
            const option = document.createElement("option");
            option.value = vehicule.id;
            option.textContent = `${vehicule.marque} ${vehicule.modele} - ${vehicule.energie}`;
            selectVehicule.appendChild(option);
        });

        selectVehicule.addEventListener("change", () => {
            validateRequiredSelect(selectVehicule);
            mettreAJourBlocEcologique();
        });
    } catch (error) {
        console.error("Erreur chargement véhicules :", error);
        afficherMessage("Impossible de charger vos véhicules.");
    }
}

// ==========================================================
// Création trajet
// ==========================================================
function initialiserFormulaire() {
    const form = document.getElementById("creer-trajet-form");
    if (!form) return;

    const departInput = document.getElementById("depart");
    const arriveeInput = document.getElementById("arrivee");
    const dateDepartInput = document.getElementById("dateDepart");
    const prixInput = document.getElementById("prixParPlace");
    const placesInput = document.getElementById("placesTotal");
    const vehiculeInput = document.getElementById("vehiculeId");
    const submitButton = document.getElementById("btn-creer-trajet");

    departInput?.addEventListener("input", () => validateRequiredText(departInput));
    arriveeInput?.addEventListener("input", () => validateRequiredText(arriveeInput));
    dateDepartInput?.addEventListener("change", () => validateRequiredDateTime(dateDepartInput));
    prixInput?.addEventListener("input", () => validateRequiredNumber(prixInput, 1));
    placesInput?.addEventListener("input", () => validateRequiredNumber(placesInput, 1));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        nettoyerMessage();

        if (!getToken()) {
            afficherMessage("Vous devez être connecté en tant que chauffeur.");
            return;
        }

        const departValide = validateRequiredText(departInput);
        const arriveeValide = validateRequiredText(arriveeInput);
        const dateValide = validateRequiredDateTime(dateDepartInput);
        const prixValide = validateRequiredNumber(prixInput, 1);
        const placesValides = validateRequiredNumber(placesInput, 1);
        const vehiculeValide = validateRequiredSelect(vehiculeInput);

        if (
            !departValide ||
            !arriveeValide ||
            !dateValide ||
            !prixValide ||
            !placesValides ||
            !vehiculeValide
        ) {
            afficherMessage("Tous les champs obligatoires doivent être remplis correctement.");
            return;
        }

        const payload = {
            departVille: departInput.value.trim(),
            arriveeVille: arriveeInput.value.trim(),
            dateDepart: dateDepartInput.value,
            prixParPlace: Number(prixInput.value),
            placesTotal: Number(placesInput.value),
            vehiculeId: Number(vehiculeInput.value)
        };

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Création en cours...";
            }

            const resultat = await apiFetch("/api/trajets", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            afficherMessage("Trajet créé avec succès.", "success");
            console.log("Trajet créé :", resultat);

            form.reset();
            [
                departInput,
                arriveeInput,
                dateDepartInput,
                prixInput,
                placesInput,
                vehiculeInput
            ].forEach((input) => setFieldState(input, null));

            mettreAJourBlocEcologique();

            setTimeout(() => {
                window.history.pushState({}, "", "/mes-trajets");
                window.dispatchEvent(new Event("popstate"));
            }, 1000);
        } catch (error) {
            console.error(error);
            afficherMessage(error?.data?.message || "Impossible de créer le trajet.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Créer le trajet";
            }
        }
    });
}

// ==========================================================
// Init page
// ==========================================================
brancherAutocomplete("depart", "suggestions-depart");
brancherAutocomplete("arrivee", "suggestions-arrivee");
chargerVehicules();
initialiserFormulaire();