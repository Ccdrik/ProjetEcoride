import { apiFetch } from "../api/client.js";

function setFieldState(input, isValid) {
    input.classList.remove("is-valid", "is-invalid");

    if (isValid === true) {
        input.classList.add("is-valid");
    } else if (isValid === false) {
        input.classList.add("is-invalid");
    }
}

function validateRequiredText(input) {
    const value = input.value.trim();

    if (value.length === 0) {
        setFieldState(input, null);
        return false;
    }

    const isValid = value.length >= 2;
    setFieldState(input, isValid);
    return isValid;
}

function validateRequiredSelect(input) {
    const isValid = !!input.value;
    setFieldState(input, isValid);
    return isValid;
}

function validateNbPlaces(input) {
    const value = input.value.trim();

    if (value.length === 0) {
        setFieldState(input, null);
        return true;
    }

    const numberValue = Number(value);
    const isValid = Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 8;
    setFieldState(input, isValid);
    return isValid;
}

function run() {
    const form = document.getElementById("form-ajouter-vehicule");
    if (!form) return;

    const marqueInput = document.getElementById("vehicule-marque");
    const modeleInput = document.getElementById("vehicule-modele");
    const energieInput = document.getElementById("vehicule-energie");
    const couleurInput = document.getElementById("vehicule-couleur");
    const immatriculationInput = document.getElementById("vehicule-immatriculation");
    const nbPlacesInput = document.getElementById("vehicule-nbPlaces");
    const submitButton = document.getElementById("btn-ajouter-vehicule");

    marqueInput?.addEventListener("input", () => validateRequiredText(marqueInput));
    modeleInput?.addEventListener("input", () => validateRequiredText(modeleInput));
    energieInput?.addEventListener("change", () => validateRequiredSelect(energieInput));
    nbPlacesInput?.addEventListener("input", () => validateNbPlaces(nbPlacesInput));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const marqueValid = validateRequiredText(marqueInput);
        const modeleValid = validateRequiredText(modeleInput);
        const energieValid = validateRequiredSelect(energieInput);
        const nbPlacesValid = validateNbPlaces(nbPlacesInput);

        if (!marqueValid || !modeleValid || !energieValid || !nbPlacesValid) {
            return;
        }

        const payload = {
            marque: marqueInput.value.trim(),
            modele: modeleInput.value.trim(),
            energie: energieInput.value.trim(),
            couleur: couleurInput.value.trim(),
            immatriculation: immatriculationInput.value.trim(),
            nbPlaces: nbPlacesInput.value ? Number(nbPlacesInput.value) : null
        };

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Ajout en cours...";
            }

            await apiFetch("/api/me/vehicules", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            alert("Véhicule ajouté.");
            window.history.pushState({}, "", "/mon-compte");
            window.dispatchEvent(new Event("popstate"));
        } catch (e) {
            console.error(e);
            alert(e.message || "Impossible d'ajouter le véhicule.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Ajouter le véhicule";
            }
        }
    });
}

run();