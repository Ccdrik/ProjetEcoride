## Test SQL ECORIDE

## 1. Voir les utilisateur

SELECT * FROM utilisateur;

## 2. Voir les trajets avec conducteur

SELECT t.depart, t.destination, u.nom
FROM trajet t 
Join utilisateur u ON t.conducteur_id = u.id;

## 3. Voir les reservation actives 

SELECT u.nom, t.depart, t.destination
FROM reservation r
JOIN utilisateur u ON r.passager_id = u.id
JOIN trajet t ON r.trajet_id = t.id
WHERE r.status = 'ACTIVE';