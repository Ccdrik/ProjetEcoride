-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: ecoride
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `doctrine_migration_versions`
--

DROP TABLE IF EXISTS `doctrine_migration_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reservation`
--

DROP TABLE IF EXISTS `reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nb_places` smallint NOT NULL,
  `statut` varchar(30) NOT NULL,
  `date_creation` datetime NOT NULL,
  `trajet_id` int NOT NULL,
  `passager_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_42C84955D12A823` (`trajet_id`),
  KEY `IDX_42C8495571A51189` (`passager_id`),
  CONSTRAINT `FK_42C8495571A51189` FOREIGN KEY (`passager_id`) REFERENCES `utilisateur` (`id`),
  CONSTRAINT `FK_42C84955D12A823` FOREIGN KEY (`trajet_id`) REFERENCES `trajet` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trajet`
--

DROP TABLE IF EXISTS `trajet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trajet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_ville` varchar(255) NOT NULL,
  `arrivee_ville` varchar(255) NOT NULL,
  `date_depart` datetime NOT NULL,
  `prix_par_place` int NOT NULL,
  `places_total` smallint NOT NULL,
  `places_restantes` smallint NOT NULL,
  `statut` varchar(30) NOT NULL,
  `conducteur_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_2B5BA98CF16F4AC6` (`conducteur_id`),
  CONSTRAINT `FK_2B5BA98CF16F4AC6` FOREIGN KEY (`conducteur_id`) REFERENCES `utilisateur` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transaction_credit`
--

DROP TABLE IF EXISTS `transaction_credit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_credit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_operation` varchar(20) NOT NULL,
  `montant` int NOT NULL,
  `motif` varchar(50) NOT NULL,
  `date_creation` datetime NOT NULL,
  `utilisateur_id` int NOT NULL,
  `reservation_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_6ABC1CBEFB88E14F` (`utilisateur_id`),
  KEY `IDX_6ABC1CBEB83297E7` (`reservation_id`),
  CONSTRAINT `FK_6ABC1CBEB83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`),
  CONSTRAINT `FK_6ABC1CBEFB88E14F` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(80) NOT NULL,
  `prenom` varchar(80) NOT NULL,
  `email` varchar(180) NOT NULL,
  `mot_de_passe_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `date_creation` datetime NOT NULL,
  `solde_credits` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_1D1C63B3E7927C74` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicule`
--

DROP TABLE IF EXISTS `vehicule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marque` varchar(100) NOT NULL,
  `modele` varchar(100) NOT NULL,
  `energie` varchar(30) NOT NULL,
  `proprietaire_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_292FFF1D76C50E4A` (`proprietaire_id`),
  CONSTRAINT `FK_292FFF1D76C50E4A` FOREIGN KEY (`proprietaire_id`) REFERENCES `utilisateur` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-11 22:40:26
