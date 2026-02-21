<?php

namespace App\DataFixtures;

use App\Entity\Reservation;
use App\Entity\Trajet;
use App\Entity\TransactionCredit;
use App\Entity\Utilisateur;
use App\Entity\Vehicule;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $hasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        // ==========
        // UTILISATEURS (2 admin, 2 employé, 3 chauffeurs, 3 passagers)
        // ==========
        $users = [];

        // Admins (credits fixes 999)
        $users['admin1'] = $this->makeUser($manager, 'Admin', 'Alice', 'admin1@ecoride.local', 'ROLE_ADMIN', 999, 'admin123');
        $users['admin2'] = $this->makeUser($manager, 'Admin', 'Bruno', 'admin2@ecoride.local', 'ROLE_ADMIN', 999, 'admin123');

        // Employés (credits fixes 999)
        $users['emp1'] = $this->makeUser($manager, 'Employe', 'Emma', 'employe1@ecoride.local', 'ROLE_EMPLOYE', 999, 'employe123');
        $users['emp2'] = $this->makeUser($manager, 'Employe', 'Lucas', 'employe2@ecoride.local', 'ROLE_EMPLOYE', 999, 'employe123');

        // Chauffeurs (credits différents)
        $users['ch1'] = $this->makeUser($manager, 'Chauffeur', 'Nina', 'chauffeur1@ecoride.local', 'ROLE_CHAUFFEUR', 120, 'chauffeur123');
        $users['ch2'] = $this->makeUser($manager, 'Chauffeur', 'Omar', 'chauffeur2@ecoride.local', 'ROLE_CHAUFFEUR', 75, 'chauffeur123');
        $users['ch3'] = $this->makeUser($manager, 'Chauffeur', 'Paul', 'chauffeur3@ecoride.local', 'ROLE_CHAUFFEUR', 200, 'chauffeur123');

        // Passagers (credits différents)
        $users['p1'] = $this->makeUser($manager, 'Passager', 'Sara', 'passager1@ecoride.local', 'ROLE_PASSAGER', 30, 'passager123');
        $users['p2'] = $this->makeUser($manager, 'Passager', 'Tom', 'passager2@ecoride.local', 'ROLE_PASSAGER', 55, 'passager123');
        $users['p3'] = $this->makeUser($manager, 'Passager', 'Yasmin', 'passager3@ecoride.local', 'ROLE_PASSAGER', 10, 'passager123');

        // ==========
        // VEHICULES (1 par chauffeur)
        // ==========
        $v1 = (new Vehicule())
            ->setMarque('Peugeot')
            ->setModele('208')
            ->setEnergie('Essence')
            ->setProprietaire($users['ch1']);
        $manager->persist($v1);

        $v2 = (new Vehicule())
            ->setMarque('Renault')
            ->setModele('Clio')
            ->setEnergie('Diesel')
            ->setProprietaire($users['ch2']);
        $manager->persist($v2);

        $v3 = (new Vehicule())
            ->setMarque('Tesla')
            ->setModele('Model 3')
            ->setEnergie('Electrique')
            ->setProprietaire($users['ch3']);
        $manager->persist($v3);

        // ==========
        // TRAJETS (quelques trajets ouverts)
        // ==========
        $t1 = (new Trajet())
            ->setDepartVille('Châteauroux')
            ->setArriveeVille('Tours')
            ->setDateDepart(new \DateTimeImmutable('+2 days 08:30'))
            ->setPrixParPlace(10)
            ->setPlacesTotal(3)
            ->setPlacesRestantes(3)
            ->setStatut('OUVERT')
            ->setConducteur($users['ch1']);
        $manager->persist($t1);

        $t2 = (new Trajet())
            ->setDepartVille('Bourges')
            ->setArriveeVille('Orléans')
            ->setDateDepart(new \DateTimeImmutable('+3 days 18:00'))
            ->setPrixParPlace(12)
            ->setPlacesTotal(4)
            ->setPlacesRestantes(4)
            ->setStatut('OUVERT')
            ->setConducteur($users['ch2']);
        $manager->persist($t2);

        $t3 = (new Trajet())
            ->setDepartVille('Poitiers')
            ->setArriveeVille('Paris')
            ->setDateDepart(new \DateTimeImmutable('+5 days 07:15'))
            ->setPrixParPlace(18)
            ->setPlacesTotal(3)
            ->setPlacesRestantes(3)
            ->setStatut('OUVERT')
            ->setConducteur($users['ch3']);
        $manager->persist($t3);

        // ==========
        // RESERVATIONS (3 passagers)
        // ==========
        $r1 = (new Reservation())
            ->setPassager($users['p1'])
            ->setTrajet($t1)
            ->setNbPlaces(1)
            ->setStatut('CONFIRME')
            ->setDateCreation(new \DateTimeImmutable('-1 day'));
        $manager->persist($r1);
        $t1->setPlacesRestantes($t1->getPlacesRestantes() - 1);

        $r2 = (new Reservation())
            ->setPassager($users['p2'])
            ->setTrajet($t2)
            ->setNbPlaces(2)
            ->setStatut('CONFIRME')
            ->setDateCreation(new \DateTimeImmutable('-2 hours'));
        $manager->persist($r2);
        $t2->setPlacesRestantes($t2->getPlacesRestantes() - 2);

        $r3 = (new Reservation())
            ->setPassager($users['p3'])
            ->setTrajet($t3)
            ->setNbPlaces(1)
            ->setStatut('EN_ATTENTE')
            ->setDateCreation(new \DateTimeImmutable('-10 minutes'));
        $manager->persist($r3);
        $t3->setPlacesRestantes($t3->getPlacesRestantes() - 1);

        // ==========
        // TRANSACTIONS CREDITS (solde initial pour chacun)
        // ==========
        foreach ($users as $u) {
            $tr = (new TransactionCredit())
                ->setUtilisateur($u)
                ->setTypeOperation('CREDIT')
                ->setMontant($u->getSoldeCredits())
                ->setMotif('Solde initial');
            $manager->persist($tr);
        }

        $manager->flush();
    }

    private function makeUser(
        ObjectManager $manager,
        string $nom,
        string $prenom,
        string $email,
        string $role,
        int $credits,
        string $plainPassword
    ): Utilisateur {
        $u = (new Utilisateur())
            ->setNom($nom)
            ->setPrenom($prenom)
            ->setEmail($email)
            ->setRole($role)
            ->setSoldeCredits($credits);

        // hash password -> motDePasseHash
        $u->setMotDePasseHash($this->hasher->hashPassword($u, $plainPassword));

        $manager->persist($u);
        return $u;
    }
}