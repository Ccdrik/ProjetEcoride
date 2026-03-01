<?php

namespace App\Controller\Api;

use App\Entity\Reservation;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use App\Repository\ReservationRepository;
use App\Repository\TrajetRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Historique des trajets de l'utilisateur connecté.
 *
 * Objectif front :
 * - afficher "à venir" et "passés"
 * - inclure mes trajets en tant que PASSAGER (via réservations)
 * - inclure mes trajets en tant que CHAUFFEUR (via conducteur)
 */
final class MeHistoriqueController extends AbstractController
{
    #[IsGranted('ROLE_USER')]
    #[Route('/api/me/historique', name: 'api_me_historique', methods: ['GET'])]
    public function historique(
        ReservationRepository $reservations,
        TrajetRepository $trajets
    ): JsonResponse {
        $u = $this->getUser();

        if (!$u instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $now = new \DateTimeImmutable();

        $avenir = [];
        $passe = [];

        // ==========================================================
        // 1) Mes trajets en tant que PASSAGER (réservations)
        // ==========================================================
        $mesReservations = $reservations->findBy(
            ['passager' => $u],
            ['dateCreation' => 'DESC']
        );

        foreach ($mesReservations as $r) {
            /** @var Reservation $r */
            $t = $r->getTrajet();
            if (!$t instanceof Trajet) {
                continue;
            }

            $row = [
                'id' => $t->getId(),
                'departVille' => $t->getDepartVille(),
                'arriveeVille' => $t->getArriveeVille(),
                'dateDepart' => $t->getDateDepart()?->format('c'),
                'prixParPlace' => $t->getPrixParPlace(),
                'statut' => $t->getStatut(),
                'roleDansTrajet' => 'PASSAGER',
                'nbPlaces' => $r->getNbPlaces(),
                'reservationId' => $r->getId(),
                'reservationStatut' => $r->getStatut(),
            ];

            if ($t->getDateDepart() >= $now) {
                $avenir[] = $row;
            } else {
                $passe[] = $row;
            }
        }

        // ==========================================================
        // 2) Mes trajets en tant que CHAUFFEUR
        // ==========================================================
        $mesTrajetsChauffeur = $trajets->findBy(
            ['conducteur' => $u],
            ['dateDepart' => 'DESC']
        );

        foreach ($mesTrajetsChauffeur as $t) {
            /** @var Trajet $t */
            $row = [
                'id' => $t->getId(),
                'departVille' => $t->getDepartVille(),
                'arriveeVille' => $t->getArriveeVille(),
                'dateDepart' => $t->getDateDepart()?->format('c'),
                'prixParPlace' => $t->getPrixParPlace(),
                'statut' => $t->getStatut(),
                'roleDansTrajet' => 'CHAUFFEUR',
                'nbPlaces' => null,
                'reservationId' => null,
                'reservationStatut' => null,
            ];

            if ($t->getDateDepart() >= $now) {
                $avenir[] = $row;
            } else {
                $passe[] = $row;
            }
        }

        // Optionnel : trier l'avenir par date croissante (plus logique côté UI)
        usort($avenir, fn ($a, $b) => strcmp((string) $a['dateDepart'], (string) $b['dateDepart']));
        // Passé par date décroissante (déjà à peu près ok), mais on peut aussi trier :
        usort($passe, fn ($a, $b) => strcmp((string) $b['dateDepart'], (string) $a['dateDepart']));

        return $this->json([
            'avenir' => $avenir,
            'passe' => $passe,
        ]);
    }
}