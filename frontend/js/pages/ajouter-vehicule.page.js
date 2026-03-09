import { apiFetch } from "../api/client.js";

console.log("ajouter-vehicule.page.js chargé");

function run() {
    const form = document.getElementById("form-ajouter-vehicule");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            marque: document.getElementById("vehicule-marque").value.trim(),
            modele: document.getElementById("vehicule-modele").value.trim(),
            energie: document.getElementById("vehicule-energie").value.trim(),
            couleur: document.getElementById("vehicule-couleur").value.trim(),
            immatriculation: document.getElementById("vehicule-immatriculation").value.trim(),
            nbPlaces: document.getElementById("vehicule-nbPlaces").value
                ? Number(document.getElementById("vehicule-nbPlaces").value)
                : null
        };

        try {
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
        }
    });
}

run();