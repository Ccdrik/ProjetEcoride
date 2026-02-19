<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260211212332 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE reservation (id INT AUTO_INCREMENT NOT NULL, nb_places SMALLINT NOT NULL, statut VARCHAR(30) NOT NULL, date_creation DATETIME NOT NULL, trajet_id INT NOT NULL, passager_id INT NOT NULL, INDEX IDX_42C84955D12A823 (trajet_id), INDEX IDX_42C8495571A51189 (passager_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE trajet (id INT AUTO_INCREMENT NOT NULL, depart_ville VARCHAR(255) NOT NULL, arrivee_ville VARCHAR(255) NOT NULL, date_depart DATETIME NOT NULL, prix_par_place INT NOT NULL, places_total SMALLINT NOT NULL, places_restantes SMALLINT NOT NULL, statut VARCHAR(30) NOT NULL, conducteur_id INT NOT NULL, INDEX IDX_2B5BA98CF16F4AC6 (conducteur_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE transaction_credit (id INT AUTO_INCREMENT NOT NULL, type_operation VARCHAR(20) NOT NULL, montant INT NOT NULL, motif VARCHAR(50) NOT NULL, date_creation DATETIME NOT NULL, utilisateur_id INT NOT NULL, reservation_id INT DEFAULT NULL, INDEX IDX_6ABC1CBEFB88E14F (utilisateur_id), INDEX IDX_6ABC1CBEB83297E7 (reservation_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE utilisateur (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(80) NOT NULL, prenom VARCHAR(80) NOT NULL, email VARCHAR(180) NOT NULL, mot_de_passe_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, date_creation DATETIME NOT NULL, solde_credits INT NOT NULL, UNIQUE INDEX UNIQ_1D1C63B3E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE vehicule (id INT AUTO_INCREMENT NOT NULL, marque VARCHAR(100) NOT NULL, modele VARCHAR(100) NOT NULL, energie VARCHAR(30) NOT NULL, proprietaire_id INT NOT NULL, INDEX IDX_292FFF1D76C50E4A (proprietaire_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C84955D12A823 FOREIGN KEY (trajet_id) REFERENCES trajet (id)');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C8495571A51189 FOREIGN KEY (passager_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE trajet ADD CONSTRAINT FK_2B5BA98CF16F4AC6 FOREIGN KEY (conducteur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE transaction_credit ADD CONSTRAINT FK_6ABC1CBEFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id)');
        $this->addSql('ALTER TABLE transaction_credit ADD CONSTRAINT FK_6ABC1CBEB83297E7 FOREIGN KEY (reservation_id) REFERENCES reservation (id)');
        $this->addSql('ALTER TABLE vehicule ADD CONSTRAINT FK_292FFF1D76C50E4A FOREIGN KEY (proprietaire_id) REFERENCES utilisateur (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation DROP FOREIGN KEY FK_42C84955D12A823');
        $this->addSql('ALTER TABLE reservation DROP FOREIGN KEY FK_42C8495571A51189');
        $this->addSql('ALTER TABLE trajet DROP FOREIGN KEY FK_2B5BA98CF16F4AC6');
        $this->addSql('ALTER TABLE transaction_credit DROP FOREIGN KEY FK_6ABC1CBEFB88E14F');
        $this->addSql('ALTER TABLE transaction_credit DROP FOREIGN KEY FK_6ABC1CBEB83297E7');
        $this->addSql('ALTER TABLE vehicule DROP FOREIGN KEY FK_292FFF1D76C50E4A');
        $this->addSql('DROP TABLE reservation');
        $this->addSql('DROP TABLE trajet');
        $this->addSql('DROP TABLE transaction_credit');
        $this->addSql('DROP TABLE utilisateur');
        $this->addSql('DROP TABLE vehicule');
    }
}
