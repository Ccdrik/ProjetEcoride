<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260310101148 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE trajet ADD vehicule_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE trajet ADD CONSTRAINT FK_2B5BA98C4A4A3511 FOREIGN KEY (vehicule_id) REFERENCES vehicule (id)');
        $this->addSql('CREATE INDEX IDX_2B5BA98C4A4A3511 ON trajet (vehicule_id)');
        $this->addSql('ALTER TABLE vehicule ADD couleur VARCHAR(50) DEFAULT NULL, ADD immatriculation VARCHAR(30) DEFAULT NULL, ADD nb_places INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE trajet DROP FOREIGN KEY FK_2B5BA98C4A4A3511');
        $this->addSql('DROP INDEX IDX_2B5BA98C4A4A3511 ON trajet');
        $this->addSql('ALTER TABLE trajet DROP vehicule_id');
        $this->addSql('ALTER TABLE vehicule DROP couleur, DROP immatriculation, DROP nb_places');
    }
}
