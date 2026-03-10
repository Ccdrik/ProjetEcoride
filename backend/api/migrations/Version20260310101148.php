<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260310101148 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout des champs couleur, immatriculation et nb_places sur vehicule';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vehicule ADD couleur VARCHAR(50) DEFAULT NULL, ADD immatriculation VARCHAR(30) DEFAULT NULL, ADD nb_places INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vehicule DROP couleur, DROP immatriculation, DROP nb_places');
    }
}