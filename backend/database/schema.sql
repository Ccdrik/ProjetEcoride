CREATE DATABASE IF NOT EXISTS ecoride;
USE ecoride;

CREATE TABLE utilisateur (

    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR (80) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,

    role ENUM('USER','EMPLOYEE','ADMIN') NOT NULL DEFAULT 'USER',
    credits int NOT NULL DEFAULT 20,

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP  
);


CREATE TABLE vehicule ( 
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,

    marque VARCHAR(80) NOT NULL,
    modele VARCHAR(80) NOT NULL,
    annee INT NOT NULL,
    immatriculation VARCHAR(9) NOT NULL UNIQUE,

    places_totales TINYINT UNSIGNED NOT NULL,
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_vehicule_utilisateur
        FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id)
        ON DELETE CASCADE
    
);

CREATE TABLE trajet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conducteur_id INT NOT NULL,
    vehicule_id INT NOT NULL,

    depart VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    date_trajet DATETIME NOT NULL,

    places_totales TINYINT UNSIGNED NOT NULL,
    places_disponibles TINYINT UNSIGNED NOT NULL,

    prix_credits INT NOT NULL,
    status ENUM('PLANIFIE','EN_COURS','TERMINE','ANNULE') NOT NULL DEFAULT 'PLANIFIE',

    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trajet_conducteur
        FOREIGN KEY (conducteur_id)
        REFERENCES utilisateur(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_trajet_vehicule
        FOREIGN KEY (vehicule_id)
        REFERENCES vehicule(id)
        ON DELETE RESTRICT,

    CHECK (places_totales >= 1),
    CHECK (places_disponibles <= places_totales),
    CHECK (prix_credits >= 1)
);

CREATE TABLE reservation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trajet_id INT NOT NULL,
    passager_id INT NOT NULL,
    
    places_reservees TINYINT UNSIGNED NOT NULL,
    status ENUM('ACTIVE','ANNULEE') NOT NULL DEFAULT 'ACTIVE',
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     
    CONSTRAINT fk_reservation_trajet
        FOREIGN KEY (trajet_id)
        REFERENCES trajet(id)
        ON DELETE CASCADE,
 
    CONSTRAINT fk_reservation_passager
        FOREIGN KEY (passager_id)
        REFERENCES utilisateur(id)
        ON DELETE RESTRICT,

    UNIQUE (trajet_id, passager_id),
    CHECK (places_reservees >= 1)
);



CREATE TABLE transaction_credit (
    id  INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    type ENUM('AJOUT_CREDITS','DEPENSE','REMBOURSEMENT') NOT NULL,
    montant INT NOT NULL,
    contexte VARCHAR(30) NOT NULL,
    reference_id INT NULL,
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_utilisateur
        FOREIGN KEY (utilisateur_id)
        REFERENCES utilisateur(id)
        ON DELETE RESTRICT,

    CHECK (montant >= 1)    


);