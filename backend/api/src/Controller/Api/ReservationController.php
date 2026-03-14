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
use Symfony\Bundle\SecurityBundle\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class ReservationController extends AbstractController
{
    #[IsGranted('ROLE_PASSAGER')]
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
        $nbPlaces = (int) ($donnees['nbPlaces'] ?? 1);

        return $this->effectuerReservation($trajet, $nbPlaces, $em);
    }

    #[IsGranted('ROLE_PASSAGER')]
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
        $nbPlaces = (int) ($donnees['nbPlaces'] ?? 1);

        return $this->effectuerReservation($trajet, $nbPlaces, $em);
    }

    #[IsGranted('ROLE_PASSAGER')]
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

        $trajet = $trajetRepository->find((int) $trajetId);
        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $nbPlaces = (int) ($donnees['nbPlaces'] ?? 1);

        return $this->effectuerReservation($trajet, $nbPlaces, $em);
    }

    #[IsGranted('ROLE_USER')]
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

        $data = array_map(static fn (Reservation $r) => [
            'id' => $r->getId(),
            'trajetId' => $r->getTrajet()?->getId(),
            'nbPlaces' => $r->getNbPlaces(),
            'statut' => $r->getStatut(),
            'dateCreation' => $r->getDateCreation()?->format('c'),
            'creditVerseAuChauffeur' => $r->isCreditVerseAuChauffeur(),
            'departVille' => $r->getTrajet()?->getDepartVille(),
            'arriveeVille' => $r->getTrajet()?->getArriveeVille(),
            'dateDepart' => $r->getTrajet()?->getDateDepart()?->format('c'),
            'prixParPlace' => $r->getTrajet()?->getPrixParPlace(),
        ], $reservations);

        return $this->json($data);
    }

    #[IsGranted('ROLE_USER')]
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

        if ($reservation->getPassager()?->getId() !== $utilisateur->getId()) {
            return $this->json(['message' => 'Interdit : réservation non propriétaire'], 403);
        }

        if ($reservation->getStatut() === 'ANNULEE') {
            return $this->json(['message' => 'Réservation déjà annulée'], 409);
        }

        $trajet = $reservation->getTrajet();
        if (!$trajet) {
            return $this->json(['message' => 'Trajet manquant sur la réservation'], 500);
        }

        if (in_array($trajet->getStatut(), ['EN_COURS', 'TERMINE'], true)) {
            return $this->json(['message' => 'Impossible d’annuler une réservation pour un trajet déjà commencé ou terminé'], 409);
        }

        $nbPlaces = (int) $reservation->getNbPlaces();
        $prixTotal = ((int) $trajet->getPrixParPlace()) * $nbPlaces;

        $reservation->setStatut('ANNULEE');

        $trajet->setPlacesRestantes(((int) $trajet->getPlacesRestantes()) + $nbPlaces);

        $utilisateur->setSoldeCredits(((int) $utilisateur->getSoldeCredits()) + $prixTotal);

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

    private function effectuerReservation(Trajet $trajet, int $nbPlaces, EntityManagerInterface $em): JsonResponse
    {
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ($nbPlaces <= 0) {
            return $this->json(['message' => 'nbPlaces doit être >= 1'], 400);
        }

        if ($trajet->getStatut() !== 'PLANIFIE') {
            return $this->json(['message' => 'Trajet non réservable'], 409);
        }

        if ((int) $trajet->getPlacesRestantes() < $nbPlaces) {
            return $this->json([
                'message' => 'Pas assez de places restantes',
                'placesRestantes' => $trajet->getPlacesRestantes(),
            ], 409);
        }

        if ($trajet->getConducteur()?->getId() === $utilisateur->getId()) {
            return $this->json(['message' => 'Le conducteur ne peut pas réserver son propre trajet'], 409);
        }

        $prixParPlace = (int) $trajet->getPrixParPlace();
        $prixTotal = $prixParPlace * $nbPlaces;

        $commissionPlateforme = 2 * $nbPlaces;
        $gainChauffeur = $prixTotal - $commissionPlateforme;

        if ($prixParPlace < 2) {
            return $this->json([
                'message' => 'Le prix par place doit être au minimum de 2 crédits',
            ], 409);
        }

        if ($gainChauffeur < 0) {
            return $this->json([
                'message' => 'Montant invalide pour le calcul des crédits',
            ], 409);
        }

        if ((int) $utilisateur->getSoldeCredits() < $prixTotal) {
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
            ->setStatut('CONFIRMEE')
            ->setDateCreation(new \DateTimeImmutable())
            ->setCreditVerseAuChauffeur(false);

        $trajet->setPlacesRestantes(((int) $trajet->getPlacesRestantes()) - $nbPlaces);

        $utilisateur->setSoldeCredits(((int) $utilisateur->getSoldeCredits()) - $prixTotal);

        $transactionDebit = (new TransactionCredit())
            ->setUtilisateur($utilisateur)
            ->setReservation($reservation)
            ->setTypeOperation('DEBIT')
            ->setMontant($prixTotal)
            ->setMotif('Réservation trajet #' . $trajet->getId())
            ->setDateCreation(new \DateTimeImmutable());

        $transactionCommission = (new TransactionCredit())
            ->setUtilisateur($utilisateur)
            ->setReservation($reservation)
            ->setTypeOperation('COMMISSION')
            ->setMontant($commissionPlateforme)
            ->setMotif('Commission plateforme trajet #' . $trajet->getId())
            ->setDateCreation(new \DateTimeImmutable());

        $em->persist($reservation);
        $em->persist($transactionDebit);
        $em->persist($transactionCommission);
        $em->flush();

        return $this->json([
            'message' => 'Réservation créée',
            'reservation' => [
                'id' => $reservation->getId(),
                'trajetId' => $trajet->getId(),
                'passagerId' => $utilisateur->getId(),
                'nbPlaces' => $reservation->getNbPlaces(),
                'statut' => $reservation->getStatut(),
                'creditVerseAuChauffeur' => $reservation->isCreditVerseAuChauffeur(),
                'dateCreation' => $reservation->getDateCreation()?->format('c'),
            ],
            'trajet' => [
                'placesRestantes' => $trajet->getPlacesRestantes(),
            ],
            'credits' => [
                'prixTotal' => $prixTotal,
                'commissionPlateforme' => $commissionPlateforme,
                'gainChauffeurPrevu' => $gainChauffeur,
                'soldeCredits' => $utilisateur->getSoldeCredits(),
            ],
        ], 201);
    }

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