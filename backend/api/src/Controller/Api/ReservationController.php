<?php

namespace App\Controller\Api;

use App\Entity\Reservation;
use App\Entity\TransactionCredit;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use App\Repository\ReservationRepository;
use App\Repository\TrajetRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Controller API pour gérer les réservations de trajets.
 *
 * Ici j'ai volontairement mis l'essentiel de la logique métier dans ce controller
 * pour que ça soit simple à lire et à expliquer :
 * - création réservation
 * - décrémentation des places
 * - débit des crédits du passager
 * - création d'une transaction de type DEBIT
 * - annulation + remboursement
 * - récupération des réservations du user connecté
 */
final class ReservationController extends AbstractController
{
    /**
     * Endpoint historique :
     * POST /api/trajets/{id}/reservations
     *
     * Crée une réservation pour un trajet donné.
     */
    #[Route('/api/trajets/{id}/reservations', name: 'api_trajet_reservation_create', methods: ['POST'])]
    public function creerReservationLegacy(
        int $id,
        Request $request,
        TrajetRepository $trajetRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $trajet = $trajetRepository->find($id);
        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $donnees = $this->lireJson($request);
        $nbPlaces = (int)($donnees['nbPlaces'] ?? 1);

        return $this->effectuerReservation($trajet, $nbPlaces, $em);
    }

    /**
     * Endpoint simple pour le front :
     * POST /api/trajets/{id}/reserver
     */
    #[Route('/api/trajets/{id}/reserver', name: 'api_trajet_reserver', methods: ['POST'])]
    public function reserverDepuisTrajet(
        int $id,
        Request $request,
        TrajetRepository $trajetRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $trajet = $trajetRepository->find($id);
        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $donnees = $this->lireJson($request);
        $nbPlaces = (int)($donnees['nbPlaces'] ?? 1);

        return $this->effectuerReservation($trajet, $nbPlaces, $em);
    }

    /**
     * Endpoint REST :
     * POST /api/reservations
     *
     * Body attendu :
     * { "trajetId": 1, "nbPlaces": 2 }
     */
    #[Route('/api/reservations', name: 'api_reservation_create', methods: ['POST'])]
    public function creerReservation(
        Request $request,
        TrajetRepository $trajetRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $donnees = $this->lireJson($request);

        $trajetId = $donnees['trajetId'] ?? null;
        if (!$trajetId) {
            return $this->json(['message' => 'trajetId est obligatoire'], 400);
        }

        $trajet = $trajetRepository->find((int)$trajetId);
        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $nbPlaces = (int)($donnees['nbPlaces'] ?? 1);

        return $this->effectuerReservation($trajet, $nbPlaces, $em);
    }

    /**
     * GET /api/reservations/moi
     *
     * Renvoie toutes les réservations du passager connecté.
     */
    #[Route('/api/reservations/moi', name: 'api_reservations_moi', methods: ['GET'])]
    public function listerMesReservations(ReservationRepository $repo): JsonResponse
    {
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $reservations = $repo->findBy(
            ['passager' => $utilisateur],
            ['dateCreation' => 'DESC']
        );

        $data = array_map(static fn(Reservation $r) => [
            'id' => $r->getId(),
            'trajetId' => $r->getTrajet()?->getId(),
            'nbPlaces' => $r->getNbPlaces(),
            'statut' => $r->getStatut(),
            'dateCreation' => $r->getDateCreation()?->format('c'),
            'departVille' => $r->getTrajet()?->getDepartVille(),
            'arriveeVille' => $r->getTrajet()?->getArriveeVille(),
            'dateDepart' => $r->getTrajet()?->getDateDepart()?->format('c'),
            'prixParPlace' => $r->getTrajet()?->getPrixParPlace(),
        ], $reservations);

        return $this->json($data);
    }

    /**
     * DELETE /api/reservations/{id}
     *
     * Annule une réservation (si elle appartient au user connecté) et :
     * - remet les places restantes sur le trajet
     * - rembourse les crédits
     * - crée une transaction de type CREDIT
     */
    #[Route('/api/reservations/{id}', name: 'api_reservation_annuler', methods: ['DELETE'])]
    public function annulerReservation(
        int $id,
        ReservationRepository $repo,
        EntityManagerInterface $em
    ): JsonResponse {
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $reservation = $repo->find($id);
        if (!$reservation) {
            return $this->json(['message' => 'Réservation introuvable'], 404);
        }

        // Sécurité : seul le passager propriétaire peut annuler
        if ($reservation->getPassager()?->getId() !== $utilisateur->getId()) {
            return $this->json(['message' => 'Interdit : réservation non propriétaire'], 403);
        }

        // Éviter double annulation
        if ($reservation->getStatut() === 'ANNULEE') {
            return $this->json(['message' => 'Réservation déjà annulée'], 409);
        }

        $trajet = $reservation->getTrajet();
        if (!$trajet) {
            return $this->json(['message' => 'Trajet manquant sur la réservation'], 500);
        }

        $nbPlaces = (int)$reservation->getNbPlaces();
        $prixTotal = ((int)$trajet->getPrixParPlace()) * $nbPlaces;

        // 1) On passe la réservation en ANNULEE
        $reservation->setStatut('ANNULEE');

        // 2) On remet les places
        $trajet->setPlacesRestantes(((int)$trajet->getPlacesRestantes()) + $nbPlaces);

        // 3) On rembourse les crédits
        $utilisateur->setSoldeCredits(((int)$utilisateur->getSoldeCredits()) + $prixTotal);

        // 4) On trace le remboursement avec une transaction CREDIT
        $transaction = (new TransactionCredit())
            ->setUtilisateur($utilisateur)
            ->setReservation($reservation)
            ->setTypeOperation('CREDIT')
            ->setMontant($prixTotal)
            ->setMotif('Annulation réservation #' . $reservation->getId())
            ->setDateCreation(new \DateTimeImmutable());

        $em->persist($transaction);
        $em->flush();

        return $this->json([
            'message' => 'Réservation annulée et crédits remboursés',
            'reservation' => [
                'id' => $reservation->getId(),
                'statut' => $reservation->getStatut(),
            ],
            'trajet' => [
                'id' => $trajet->getId(),
                'placesRestantes' => $trajet->getPlacesRestantes(),
            ],
            'credits' => [
                'montantRembourse' => $prixTotal,
                'soldeCredits' => $utilisateur->getSoldeCredits(),
            ],
        ]);
    }

    /**
     * Méthode centrale : applique toutes les règles et fait les écritures en base.
     * - vérifie user connecté
     * - vérifie places / statut
     * - vérifie crédits
     * - crée réservation
     * - décrémente places
     * - débite crédits
     * - crée transaction DEBIT
     */
    private function effectuerReservation(Trajet $trajet, int $nbPlaces, EntityManagerInterface $em): JsonResponse
    {
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ($nbPlaces <= 0) {
            return $this->json(['message' => 'nbPlaces doit être >= 1'], 400);
        }

        if ($trajet->getStatut() !== 'OUVERT') {
            return $this->json(['message' => 'Trajet non réservable (statut != OUVERT)'], 409);
        }

        if ((int)$trajet->getPlacesRestantes() < $nbPlaces) {
            return $this->json([
                'message' => 'Pas assez de places restantes',
                'placesRestantes' => $trajet->getPlacesRestantes(),
            ], 409);
        }

        if ($trajet->getConducteur()?->getId() === $utilisateur->getId()) {
            return $this->json(['message' => 'Le conducteur ne peut pas réserver son propre trajet'], 409);
        }

        $prixTotal = ((int)$trajet->getPrixParPlace()) * $nbPlaces;

        if ((int)$utilisateur->getSoldeCredits() < $prixTotal) {
            return $this->json([
                'message' => 'Crédits insuffisants',
                'soldeCredits' => $utilisateur->getSoldeCredits(),
                'prixTotal' => $prixTotal,
            ], 409);
        }

        $reservation = (new Reservation())
            ->setTrajet($trajet)
            ->setPassager($utilisateur)
            ->setNbPlaces($nbPlaces)
            ->setStatut('CONFIRME')
            ->setDateCreation(new \DateTimeImmutable());

        $trajet->setPlacesRestantes(((int)$trajet->getPlacesRestantes()) - $nbPlaces);

        $utilisateur->setSoldeCredits(((int)$utilisateur->getSoldeCredits()) - $prixTotal);

        $transaction = (new TransactionCredit())
            ->setUtilisateur($utilisateur)
            ->setReservation($reservation)
            ->setTypeOperation('DEBIT')
            ->setMontant($prixTotal)
            ->setMotif('Réservation trajet #' . $trajet->getId())
            ->setDateCreation(new \DateTimeImmutable());

        $em->persist($reservation);
        $em->persist($transaction);
        $em->flush();

        return $this->json([
            'message' => 'Réservation créée',
            'reservation' => [
                'id' => $reservation->getId(),
                'trajetId' => $trajet->getId(),
                'passagerId' => $utilisateur->getId(),
                'nbPlaces' => $reservation->getNbPlaces(),
                'statut' => $reservation->getStatut(),
                'dateCreation' => $reservation->getDateCreation()?->format('c'),
            ],
            'trajet' => [
                'placesRestantes' => $trajet->getPlacesRestantes(),
            ],
            'credits' => [
                'prixTotal' => $prixTotal,
                'soldeCredits' => $utilisateur->getSoldeCredits(),
            ],
        ], 201);
    }

    /**
     * Petite méthode utilitaire : lire le body JSON de la requête.
     * Je la centralise pour éviter de répéter du code dans chaque endpoint.
     */
    private function lireJson(Request $request): array
    {
        $contenu = $request->getContent();
        if (!$contenu) {
            return [];
        }

        $data = json_decode($contenu, true);

        return is_array($data) ? $data : [];
    }
}