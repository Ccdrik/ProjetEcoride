// ==========================================================
// CLIENT API CENTRALISÉ
// ==========================================================

const API_BASE =
  window.location.hostname.includes("alwaysdata.net")
    ? "https://ecoride-api-cedric-eu-d4394ce466c6.herokuapp.com"
    : (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8080");

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
  localStorage.removeItem("user");
}

// Fonction générique pour toutes les requêtes API
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

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

  if (response.status === 401) {
    clearToken();

    if (window.location.pathname !== "/connexion") {
      window.history.pushState({}, "", "/connexion");
      window.dispatchEvent(new Event("popstate"));
    }
  }

  if (!response.ok) {
    const err = new Error(data?.message || `Erreur API (${response.status})`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}