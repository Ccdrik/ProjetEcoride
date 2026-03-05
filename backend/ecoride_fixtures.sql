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
-- Dumping data for table `doctrine_migration_versions`
--

LOCK TABLES `doctrine_migration_versions` WRITE;
/*!40000 ALTER TABLE `doctrine_migration_versions` DISABLE KEYS */;
INSERT INTO `doctrine_migration_versions` VALUES ('DoctrineMigrations\\Version20260222135531','2026-03-02 20:43:57',2898);
/*!40000 ALTER TABLE `doctrine_migration_versions` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
INSERT INTO `reservation` VALUES (1,1,'CONFIRME','2026-03-01 20:44:42',1,8),(2,2,'CONFIRME','2026-03-02 18:44:42',2,9),(3,1,'EN_ATTENTE','2026-03-02 20:34:42',3,10);
/*!40000 ALTER TABLE `reservation` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trajet`
--

LOCK TABLES `trajet` WRITE;
/*!40000 ALTER TABLE `trajet` DISABLE KEYS */;
INSERT INTO `trajet` VALUES (1,'Vichy','Lyon','2026-03-04 08:30:00',10,3,2,'OUVERT',5),(2,'Lyon','Vichy','2026-03-05 18:00:00',12,4,2,'OUVERT',6),(3,'Clermont-Ferrand','Paris','2026-03-07 07:15:00',18,3,2,'OUVERT',7);
/*!40000 ALTER TABLE `trajet` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_credit`
--

LOCK TABLES `transaction_credit` WRITE;
/*!40000 ALTER TABLE `transaction_credit` DISABLE KEYS */;
INSERT INTO `transaction_credit` VALUES (1,'CREDIT',999,'Solde initial','2026-03-02 20:44:42',1,NULL),(2,'CREDIT',999,'Solde initial','2026-03-02 20:44:42',2,NULL),(3,'CREDIT',999,'Solde initial','2026-03-02 20:44:42',3,NULL),(4,'CREDIT',999,'Solde initial','2026-03-02 20:44:42',4,NULL),(5,'CREDIT',120,'Solde initial','2026-03-02 20:44:42',5,NULL),(6,'CREDIT',75,'Solde initial','2026-03-02 20:44:42',6,NULL),(7,'CREDIT',200,'Solde initial','2026-03-02 20:44:42',7,NULL),(8,'CREDIT',30,'Solde initial','2026-03-02 20:44:42',8,NULL),(9,'CREDIT',55,'Solde initial','2026-03-02 20:44:42',9,NULL),(10,'CREDIT',10,'Solde initial','2026-03-02 20:44:42',10,NULL);
/*!40000 ALTER TABLE `transaction_credit` ENABLE KEYS */;
UNLOCK TABLES;

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
  `is_suspended` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_1D1C63B3E7927C74` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateur`
--

LOCK TABLES `utilisateur` WRITE;
/*!40000 ALTER TABLE `utilisateur` DISABLE KEYS */;
INSERT INTO `utilisateur` VALUES (1,'Admin','Justine','admin1@ecoride.local','$2y$13$6XxU39pIFC8mIpjMe9g8KOAzA10Gpw6i7HLkGB.S014TXca3Z336a','ROLE_ADMIN','2026-03-02 20:44:38',999,0),(2,'Admin','Cedric','admin2@ecoride.local','$2y$13$vntC.wg.m2il.RhODmBvt.xgh7LtJr5YFKKmGwS9gUxjMPsACWtFe','ROLE_ADMIN','2026-03-02 20:44:38',999,0),(3,'Employe','Emma','employe1@ecoride.local','$2y$13$UK.rpQycbti1ROwVPXaIuOepeMPs33lr4kBcK6ptJWwfORJUkJ4A6','ROLE_EMPLOYE','2026-03-02 20:44:39',999,0),(4,'Employe','Ugo','employe2@ecoride.local','$2y$13$.QKiSKkV2D5KUp3..sPhuOH26WiHKWM0oVIF0hZSrxo9oYslU9GkC','ROLE_EMPLOYE','2026-03-02 20:44:39',999,0),(5,'Chauffeur','Coralie','chauffeur1@ecoride.local','$2y$13$/uh2PrysR14I49v9ja.D0eJ.GBuGJYjtfqJ/NTpn5XiimQdvFbtYW','ROLE_CHAUFFEUR','2026-03-02 20:44:40',120,0),(6,'Chauffeur','Alexandre','chauffeur2@ecoride.local','$2y$13$SIn6cIAKkzBBekaILeqsBu2bJJZCP8Ev9t1l1i6.374.9/esSsnXK','ROLE_CHAUFFEUR','2026-03-02 20:44:40',75,0),(7,'Chauffeur','Chloe','chauffeur3@ecoride.local','$2y$13$ezUUgxl8QhLX1t8ab2kz5O8M.L3DFRbMI0aOw4JTandASqmIjFG8K','ROLE_CHAUFFEUR','2026-03-02 20:44:41',200,0),(8,'Passager','Jeremy','passager1@ecoride.local','$2y$13$czHW8waX.TITomTGrD3cseU2FT3glds6JnyBTd47YXpdH5yJaI9ni','ROLE_PASSAGER','2026-03-02 20:44:41',30,0),(9,'Passager','Sandrine','passager2@ecoride.local','$2y$13$0c6sZ0SyzVdHE9fi0rOY5uHNI4Imco6BccMlHtP0qhTq2G9FqiwiO','ROLE_PASSAGER','2026-03-02 20:44:42',55,0),(10,'Passager','Clemence','passager3@ecoride.local','$2y$13$k04UTs4dQHca00LCZoLvYO9BK/kM.HfimrLhGMtBl4Jci8cm3QD1G','ROLE_PASSAGER','2026-03-02 20:44:42',10,0);
/*!40000 ALTER TABLE `utilisateur` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicule`
--

LOCK TABLES `vehicule` WRITE;
/*!40000 ALTER TABLE `vehicule` DISABLE KEYS */;
INSERT INTO `vehicule` VALUES (1,'Peugeot','208','Essence',5),(2,'Renault','Clio','Diesel',6),(3,'Tesla','Model 3','Electrique',7);
/*!40000 ALTER TABLE `vehicule` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 22:36:14
