// Ici je définis l’URL de base de mon backend Symfony.
// Comme mon API tourne sur le port 8080,
// Toutes mes requêtes partiront de cette base.
const API_BASE = "http://localhost:8080";

// Petite fonction pour récupérer le token stocké dans le localStorage.
// Si l’utilisateur est connecté, le token sera utilisé pour l’Authorization.
function getToken() {
  return localStorage.getItem("token");
}

/*
  apiFetch est une fonction pour éviter
  de répéter du code fetch partout dans mon projet.

  Elle permet :
  - d’ajouter automatiquement les headers JSON
  - d’ajouter le token si l’utilisateur est connecté
  - de transformer la réponse en JSON
  - de gérer proprement les erreurs HTTP
*/
export async function apiFetch(path, options = {}) {
  // Je crée les headers à partir de ceux reçus (ou vide si rien)
  const headers = new Headers(options.headers || {});

  // Si j’envoie des données (POST par exemple),
  // je précise que le contenu est du JSON
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Si j’ai un token, je l’ajoute dans les headers Authorization
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // J’envoie la requête HTTP vers mon backend
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Je récupère la réponse sous forme de texte
  const text = await response.text();

  // J’essaie de transformer le texte en JSON
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  // Si le serveur répond avec une erreur (400, 401, 500…)
  // je lance une vraie erreur JS
  if (!response.ok) {
    const err = new Error(
      data?.message || `Erreur API (${response.status})`
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }

  // Si tout va bien, je renvoie les données JSON
  return data;
}
