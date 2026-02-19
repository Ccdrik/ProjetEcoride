<?php

namespace App\Service;

use App\Entity\Reservation;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

class ReservationService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function reserver(int $trajetId, Utilisateur $passager, int $nbPlaces): Reservation
    {
        if ($nbPlaces <= 0) {
            throw new \RuntimeException('Le nombre de places doit être supérieur à 0.');
        }

        return $this->em->wrapInTransaction(function () use ($trajetId, $passager, $nbPlaces) {

            // Lock pour éviter deux réservations simultanées
            $trajet = $this->em->find(Trajet::class, $trajetId, LockMode::PESSIMISTIC_WRITE);

            if (!$trajet) {
                throw new \RuntimeException('Trajet introuvable.');
            }

            // Bonus: empêcher le conducteur de réserver son propre trajet
            if ($trajet->getConducteur()?->getId() === $passager->getId()) {
                throw new \RuntimeException('Le conducteur ne peut pas réserver son propre trajet.');
            }

            $restantes = (int) $trajet->getPlacesRestantes();
            if ($restantes < $nbPlaces) {
                throw new \RuntimeException("Plus de place disponible sur ce trajet.");
            }

            $reservation = new Reservation();
            $reservation->setTrajet($trajet);
            $reservation->setPassager($passager);
            $reservation->setNbPlaces($nbPlaces);
            $reservation->setStatut('EN_ATTENTE'); 
            $reservation->setDateCreation(new \DateTimeImmutable());

            // Décrément des places restantes
            $nouveauRestant = $restantes - $nbPlaces;
            $trajet->setPlacesRestantes($nouveauRestant);

            if ($nouveauRestant === 0) {
            $trajet->setStatut('COMPLET');
            }


            $this->em->persist($reservation);
            $this->em->flush();

            return $reservation;
        });
    }
}
