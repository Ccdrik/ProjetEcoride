<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\ReservationRepository;
use App\Repository\TrajetRepository;
use App\Service\Mongo\MongoProvider;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
final class AvisController extends AbstractController
{
    /**
     * Affiche les avis validés d'un trajet.
     *
     * Cette route sera utilisée sur la page détail du trajet.
     * Je ne retourne que les avis VALIDE pour éviter d'afficher
     * des avis encore en attente ou refusés.
     */
    #[Route('/avis', methods: ['GET'])]
    public function list(Request $request, MongoProvider $mongo): JsonResponse
    {
        $trajetId = $request->query->getInt('trajetId');

        if ($trajetId <= 0) {
            return $this->json(['message' => 'trajetId manquant'], 400);
        }

        $cursor = $mongo->avisCollection()->find(
            [
                'trajetId' => $trajetId,
                'status' => 'VALIDE',
            ],
            [
                'sort' => ['createdAt' => -1],
            ]
        );

        $items = [];

        foreach ($cursor as $doc) {
            $items[] = [
                'id' => (string) $doc->_id,
                'trajetId' => (int) ($doc->trajetId ?? 0),
                'chauffeurId' => (int) ($doc->chauffeurId ?? 0),

                // Si je n'ai pas de pseudo dédié, j'affiche au moins une valeur lisible
                'passagerPseudo' => (string) ($doc->passagerPseudo ?? ''),

                'note' => (int) ($doc->note ?? 0),
                'commentaire' => (string) ($doc->commentaire ?? ''),
                'isProblem' => (bool) ($doc->isProblem ?? false),

                // Je formate la date Mongo en ISO pour le front
                'createdAt' => isset($doc->createdAt) && $doc->createdAt instanceof UTCDateTime
                    ? $doc->createdAt->toDateTime()->format('c')
                    : null,
            ];
        }

        return $this->json(['items' => $items]);
    }

    /**
     * Dépôt d'un avis par un utilisateur connecté.
     *
     * L'avis part en EN_ATTENTE pour qu'un employé puisse le valider
     * ou le refuser avant publication.
     */
    #[IsGranted('ROLE_USER')]
    #[Route('/avis', methods: ['POST'])]
    public function create(
        Request $request,
        MongoProvider $mongo,
        ReservationRepository $reservations,
        TrajetRepository $trajets,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof Utilisateur) {
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

        // Sécurité : seul le passager de la réservation peut laisser un avis
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

        if ($reservation->getStatut() !== 'CONFIRMEE') {
            return $this->json(['message' => 'Seules les réservations confirmées peuvent être notées'], 400);
        }

        // L'avis n'est autorisé que lorsque le trajet a été marqué comme terminé
        // par le chauffeur.
        if ($trajet->getStatut() !== 'TERMINE') {
            return $this->json(['message' => 'Le trajet doit être terminé pour laisser un avis'], 400);
        }           

        // Anti doublon : un seul avis par réservation
        $existing = $mongo->avisCollection()->findOne([
            'reservationId' => $reservationId,
        ]);

        if ($existing) {
            return $this->json(['message' => 'Avis déjà envoyé pour cette réservation'], 409);
        }

        // Je stocke l'avis dans MongoDB avec un statut EN_ATTENTE pour modération
        $doc = [
            'reservationId' => $reservationId,
            'trajetId' => $trajetId,
            'chauffeurId' => $trajet->getConducteur()->getId(),
            'passagerId' => $user->getId(),

            // Je mets un nom lisible pour l'affichage côté front
            'passagerPseudo' => trim(($user->getPrenom() ?? '') . ' ' . ($user->getNom() ?? '')),

            'note' => $note,
            'commentaire' => $commentaire,
            'isProblem' => $isProblem,
            'status' => 'EN_ATTENTE',
            'createdAt' => new UTCDateTime(),
            'moderatedAt' => null,
            'moderatedBy' => null,
        ];

        $result = $mongo->avisCollection()->insertOne($doc);

        return $this->json([
            'message' => 'Avis envoyé (en attente de validation).',
            'id' => (string) $result->getInsertedId(),
        ], 201);
    }

    /**
     * Liste des avis en attente pour l'employé.
     *
     * Cette route servira à la modération.
     */
    #[IsGranted('ROLE_EMPLOYE')]
    #[Route('/employe/avis/en-attente', methods: ['GET'])]
    public function listPending(MongoProvider $mongo): JsonResponse
    {
        $cursor = $mongo->avisCollection()->find(
            ['status' => 'EN_ATTENTE'],
            ['sort' => ['createdAt' => -1]]
        );

        $items = [];

        foreach ($cursor as $doc) {
            $items[] = [
                'id' => (string) $doc->_id,
                'reservationId' => (int) ($doc->reservationId ?? 0),
                'trajetId' => (int) ($doc->trajetId ?? 0),
                'chauffeurId' => (int) ($doc->chauffeurId ?? 0),
                'passagerId' => (int) ($doc->passagerId ?? 0),
                'passagerPseudo' => (string) ($doc->passagerPseudo ?? ''),
                'note' => (int) ($doc->note ?? 0),
                'commentaire' => (string) ($doc->commentaire ?? ''),
                'isProblem' => (bool) ($doc->isProblem ?? false),
                'status' => (string) ($doc->status ?? ''),
                'createdAt' => isset($doc->createdAt) && $doc->createdAt instanceof UTCDateTime
                    ? $doc->createdAt->toDateTime()->format('c')
                    : null,
            ];
        }

        return $this->json(['items' => $items]);
    }

    /**
     * Validation d'un avis par un employé.
     */
    #[IsGranted('ROLE_EMPLOYE')]
    #[Route('/employe/avis/{id}/valider', methods: ['PATCH'])]
    public function validateAvis(string $id, MongoProvider $mongo): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $result = $mongo->avisCollection()->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => [
                'status' => 'VALIDE',
                'moderatedAt' => new UTCDateTime(),
                'moderatedBy' => $user->getId(),
            ]]
        );

        if ($result->getMatchedCount() === 0) {
            return $this->json(['message' => 'Avis introuvable'], 404);
        }

        return $this->json(['message' => 'Avis validé']);
    }

    /**
     * Refus d'un avis par un employé.
     */
    #[IsGranted('ROLE_EMPLOYE')]
    #[Route('/employe/avis/{id}/refuser', methods: ['PATCH'])]
    public function rejectAvis(string $id, MongoProvider $mongo): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $result = $mongo->avisCollection()->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => [
                'status' => 'REFUSE',
                'moderatedAt' => new UTCDateTime(),
                'moderatedBy' => $user->getId(),
            ]]
        );

        if ($result->getMatchedCount() === 0) {
            return $this->json(['message' => 'Avis introuvable'], 404);
        }

        return $this->json(['message' => 'Avis refusé']);
    }
}