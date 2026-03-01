// ==========================================================
// CLIENT API CENTRALISÉ
// ==========================================================
// Ce fichier centralise toutes les requêtes HTTP vers
// le backend Symfony.
//
// Il permet :
// - d’ajouter automatiquement le header JSON
// - d’ajouter le token JWT si l’utilisateur est connecté
// - de gérer proprement les erreurs HTTP
// - de déconnecter automatiquement si token invalide (401)
// ==========================================================

const API_BASE = window.__APP_CONFIG__?.API_BASE || "http://localhost:8080";

// Récupération du token JWT stocké en localStorage
export function getToken() {
  return localStorage.getItem("token");
}

// Stockage du token après login
export function setToken(token) {
  localStorage.setItem("token", token);
}

// Suppression du token (logout ou erreur 401)
export function clearToken() {
  localStorage.removeItem("token");
}

// Fonction générique pour toutes les requêtes API
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  // Si on envoie du JSON (POST / PATCH)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Si token présent, on l’ajoute automatiquement
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  // Si compte suspendu ou token invalide
  if (response.status === 401) {
    clearToken();

    if (window.location.pathname !== "/connexion") {
      window.history.pushState({}, "", "/connexion");
      window.dispatchEvent(new CustomEvent("route:changed"));
    }

    // on continue et on lance l'erreur standard
  }

  if (!response.ok) {
    const err = new Error(data?.message || `Erreur API (${response.status})`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}