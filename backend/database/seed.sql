-- =========================
-- Nettoyage (ordre FK)
-- =========================
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE transaction_credit;
TRUNCATE TABLE reservation;
TRUNCATE TABLE trajet;
TRUNCATE TABLE vehicule;
TRUNCATE TABLE utilisateur;

SET FOREIGN_KEY_CHECKS = 1;


-- =========================
-- UTILISATEURS
-- colonnes: nom, prenom, email, mot_de_passe_hash, role, date_creation, solde_credits
-- =========================
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role, date_creation, solde_credits) VALUES
('Admin', 'Root', 'admin@ecoride.fr',
 '$2y$13$XOITlbX5rj4H2l3p3/ls/OD48gd4h.qThNHZZTfe3zSIaz0UyILei',
 'ROLE_ADMIN', NOW(), 9999),

('Employe', 'Emma', 'employe@ecoride.fr',
 '$2y$13$XOITlbX5rj4H2l3p3/ls/OD48gd4h.qThNHZZTfe3zSIaz0UyILei',
 'ROLE_EMPLOYEE', NOW(), 9999),

('Conducteur', 'Justine', 'conducteur@test.fr',
 '$2y$13$XOITlbX5rj4H2l3p3/ls/OD48gd4h.qThNHZZTfe3zSIaz0UyILei',
 'ROLE_USER', NOW(), 20),

('Passager', 'Alice', 'passager2@test.fr',
 '$2y$13$XOITlbX5rj4H2l3p3/ls/OD48gd4h.qThNHZZTfe3zSIaz0UyILei',
 'ROLE_USER', NOW(), 80);

-- =========================
-- VEHICULE (appartient au conducteur id=3)
-- colonnes: marque, modele, energie, proprietaire_id
-- =========================
INSERT INTO vehicule (marque, modele, energie, proprietaire_id) VALUES
('Renault', 'Clio', 'Diesel', 3);

-- =========================
-- TRAJETS
-- colonnes: depart_ville, arrivee_ville, date_depart, prix_par_place, places_total, places_restantes, statut, conducteur_id
-- =========================

-- Trajet ouvert (3 places)
INSERT INTO trajet (depart_ville, arrivee_ville, date_depart, prix_par_place, places_total, places_restantes, statut, conducteur_id) VALUES
('Vichy', 'Lyon', '2026-03-01 09:00:00', 10, 3, 3, 'OUVERT', 3);

-- Trajet presque plein (1 place restante)
INSERT INTO trajet (depart_ville, arrivee_ville, date_depart, prix_par_place, places_total, places_restantes, statut, conducteur_id) VALUES
('Clermont-Ferrand', 'Paris', '2026-03-02 07:30:00', 15, 3, 1, 'OUVERT', 3);

-- =========================
-- RESERVATION (passager id=4 sur trajet id=1)
-- colonnes: nb_places, statut, date_creation, trajet_id, passager_id
-- =========================
INSERT INTO reservation (nb_places, statut, date_creation, trajet_id, passager_id) VALUES
(1, 'EN_ATTENTE', NOW(), 1, 4);

-- =========================
-- TRANSACTION_CREDIT (optionnel mais utile)
-- colonnes: type_operation, montant, motif, date_creation, utilisateur_id, reservation_id
-- =========================
INSERT INTO transaction_credit (type_operation, montant, motif, date_creation, utilisateur_id, reservation_id) VALUES
('DEBIT', 10, 'Reservation trajet 1', NOW(), 4, 1);
