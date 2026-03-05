import { isLoggedIn, getUserRoles } from "../auth/session.js"; // adapte aux noms chez toi

if (!isLoggedIn() || !getUserRoles().includes("ROLE_ADMIN")) {
    window.location.href = "/"; // ou "/connexion"
    throw new Error("Accès interdit (admin uniquement)");
}

console.log("tableau-de-bord.page.js chargé");