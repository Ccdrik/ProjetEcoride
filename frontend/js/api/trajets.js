import { apiFetch } from "./client.js";

export function listTrajets() {
  return apiFetch("/api/trajets");
}

export function getTrajet(id) {
  return apiFetch(`/api/trajets/${id}`);
}

export function createReservation(trajetId, nbPlaces) {
  return apiFetch(`/api/trajets/${trajetId}/reservations`, {
    method: "POST",
    body: JSON.stringify({ nbPlaces })
  });
}

export function modifierTrajet(id, data) {
  return apiFetch(`/api/trajets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export function annulerTrajet(id) {
  return apiFetch(`/api/trajets/${id}/annuler`, {
    method: "PATCH"
  });
}