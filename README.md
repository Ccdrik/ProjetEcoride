# EcoRide — Projet ECF Développeur Web et Web Mobile

EcoRide est une application de covoiturage développée dans le cadre de l’ECF du titre  
**Développeur Web et Web Mobile (DWWM)**.

L’objectif du projet est de concevoir une application complète avec :

- une base de données relationnelle (MySQL),
- une base NoSQL (MongoDB),
- une API backend développée avec Symfony,
- une architecture Dockerisée reproductible.

---

## Objectifs pédagogiques

Ce projet permet de valider les compétences suivantes :

- conception et modélisation de base de données,
- écriture de requêtes SQL (SELECT, JOIN, contraintes),
- mise en place d’une API REST avec Symfony,
- utilisation de Docker pour l’environnement de développement,
- séparation des responsabilités (Nginx / PHP-FPM / BDD),
- sécurisation et préparation à l’authentification JWT.

---

##  Architecture du projet

Projet Ecoride/
├── api/ # API Symfony
├── database/
│ ├── schema.sql # Création des tables
│ └── seed.sql # Données de test
├── nginx/
│ └── default.conf # Configuration Nginx
├── docs/
│ └── sql_tests.md # Requêtes SQL de test
├── docker-compose.yml
└── README.md


---

## Environnement Docker

L’environnement de développement est entièrement Dockerisé via **Docker Compose**.

### Services utilisés

- **MySQL 8.0** : base de données relationnelle
- **phpMyAdmin** : interface de gestion MySQL
- **MongoDB** : base NoSQL (avis, signalements)
- **Mongo Express** : interface MongoDB
- **PHP 8.4 (PHP-FPM)** : exécution de Symfony
- **Nginx** : serveur web / reverse proxy

---

## Base de données relationnelle (MySQL)

La base MySQL est initialisée automatiquement au démarrage de Docker grâce aux scripts :

- `schema.sql` : création des tables et contraintes
- `seed.sql` : insertion de données de test

### Tables principales

- utilisateur
- vehicule
- trajet
- reservation
- transaction_credit

Les relations sont gérées via :

- clés étrangères
- contraintes métier (places disponibles, crédits, unicité des réservations)

---

## Base NoSQL (MongoDB)

MongoDB est utilisée pour stocker :

- les avis utilisateurs,
- les signalements et requêtes utilisateurs,

Cela permet d’éviter des jointures lourdes et d’apporter plus de flexibilité.

---

## Backend — Symfony

L’API backend est développée avec Symfony.

### Points clés

- Symfony exécuté via PHP-FPM dans Docker
- Nginx agit comme serveur web et reverse proxy
- Doctrine ORM pour l’accès à MySQL
- Doctrine DBAL pour les requêtes SQL directes
- Authentification JWT prévue (LexikJWT)

---

## Configuration des variables d’environnement

La configuration locale est définie dans :

- `.env` : valeurs par défaut
- `.env.local` : configuration spécifique Docker (non versionnée)

Exemple :

DATABASE_URL="mysql://ecoride:ecoride@mysql:3306/ecoride?serverVersion=8.0&charset=utf8mb4"


---

## Lancer le projet

### Prérequis

- Docker Desktop
- Docker Compose

### Commandes principales

docker compose up -d --build
docker compose ps


---

## Accès aux services

- API Symfony : http://localhost:8080
- phpMyAdmin : http://localhost:8081
- Mongo Express : http://localhost:8082

---

## Tests SQL

Des requêtes de test sont disponibles dans `docs/sql_tests.md` afin de vérifier :

- les relations entre tables,
- les réservations actives,
- la cohérence des données.

---

## Auteur

Projet réalisé par **Cédric** dans le cadre de l’ECF DWWM.