<?php

namespace App\Controller\Api;

use App\Repository\ReservationRepository;
use App\Repository\TrajetRepository;
use App\Service\Mongo\MongoProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
final class AvisController extends AbstractController
{
    // Affiche les avis validés (pour la page détail du trajet)
    #[Route('/avis', methods: ['GET'])]
    public function list(Request $request, MongoProvider $mongo): JsonResponse
    {
        $trajetId = $request->query->getInt('trajetId');
        if ($trajetId <= 0) {
            return $this->json(['message' => 'trajetId manquant'], 400);
        }

        $cursor = $mongo->avisCollection()->find(
            ['trajetId' => $trajetId, 'status' => 'APPROVED'],
            ['sort' => ['createdAt' => -1]]
        );

        $items = [];
        foreach ($cursor as $doc) {
            $items[] = [
                'id' => (string) $doc->_id,
                'trajetId' => (int) $doc->trajetId,
                'chauffeurId' => (int) $doc->chauffeurId,
                'passagerPseudo' => (string) ($doc->passagerPseudo ?? ''),
                'note' => (int) $doc->note,
                'commentaire' => (string) $doc->commentaire,
                'isProblem' => (bool) ($doc->isProblem ?? false),
                'createdAt' => $doc->createdAt ?? null,
            ];
        }

        return $this->json(['items' => $items]);
    }

    // Dépôt d’un avis (participant connecté) -> status PENDING (validation employé)
    #[IsGranted('ROLE_USER')]
    #[Route('/avis', methods: ['POST'])]
    public function create(
        Request $request,
        MongoProvider $mongo,
        ReservationRepository $reservations,
        TrajetRepository $trajets,
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user || !method_exists($user, 'getId')) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $payload = json_decode($request->getContent(), true) ?: [];

        $reservationId = (int) ($payload['reservationId'] ?? 0);
        $trajetId = (int) ($payload['trajetId'] ?? 0);
        $note = (int) ($payload['note'] ?? 0);
        $commentaire = trim((string) ($payload['commentaire'] ?? ''));
        $isProblem = (bool) ($payload['isProblem'] ?? false);

        if ($reservationId <= 0 || $trajetId <= 0) {
            return $this->json(['message' => 'reservationId et trajetId requis'], 400);
        }
        if ($note < 1 || $note > 5) {
            return $this->json(['message' => 'La note doit être entre 1 et 5'], 400);
        }
        if (mb_strlen($commentaire) < 3) {
            return $this->json(['message' => 'Commentaire trop court'], 400);
        }

        // Sécurité : l’avis doit venir du passager de la réservation
        $reservation = $reservations->find($reservationId);
        if (!$reservation) {
            return $this->json(['message' => 'Réservation introuvable'], 404);
        }
        if ($reservation->getPassager()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Cette réservation ne vous appartient pas'], 403);
        }
        if ($reservation->getTrajet()->getId() !== $trajetId) {
            return $this->json(['message' => 'trajetId ne correspond pas à la réservation'], 400);
        }

        $trajet = $trajets->find($trajetId);
        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        // MVP : empêcher l’avis avant le départ (amélioration : après "arrivée")
        if ($trajet->getDateDepart() > new \DateTimeImmutable()) {
            return $this->json(['message' => 'Vous ne pouvez pas noter avant le départ'], 400);
        }

        // Anti doublon : 1 avis par réservation
        $existing = $mongo->avisCollection()->findOne(['reservationId' => $reservationId]);
        if ($existing) {
            return $this->json(['message' => 'Avis déjà envoyé pour cette réservation'], 409);
        }

        $doc = [
            'reservationId' => $reservationId,
            'trajetId' => $trajetId,
            'chauffeurId' => $trajet->getConducteur()->getId(),
            'passagerId' => $user->getId(),
            'passagerPseudo' => method_exists($user, 'getPseudo') ? $user->getPseudo() : '',
            'note' => $note,
            'commentaire' => $commentaire,
            'isProblem' => $isProblem,
            'status' => 'PENDING',
            'createdAt' => new \MongoDB\BSON\UTCDateTime(),
        ];

        $result = $mongo->avisCollection()->insertOne($doc);

        return $this->json([
            'message' => 'Avis envoyé (en attente de validation).',
            'id' => (string) $result->getInsertedId(),
        ], 201);
    }
}