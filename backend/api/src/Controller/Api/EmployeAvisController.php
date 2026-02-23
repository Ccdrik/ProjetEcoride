<?php

namespace App\Controller\Api;

use App\Service\Mongo\MongoProvider;
use MongoDB\BSON\ObjectId;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_EMPLOYE')]
#[Route('/api/employe/avis')]
final class EmployeAvisController extends AbstractController
{
    #[Route('/pending', methods: ['GET'])]
    public function pending(MongoProvider $mongo): JsonResponse
    {
        $cursor = $mongo->avisCollection()->find(
            ['status' => 'PENDING'],
            ['sort' => ['createdAt' => 1]]
        );

        $items = [];
        foreach ($cursor as $doc) {
            $items[] = [
                'id' => (string) $doc->_id,
                'trajetId' => (int) $doc->trajetId,
                'reservationId' => (int) $doc->reservationId,
                'chauffeurId' => (int) $doc->chauffeurId,
                'passagerPseudo' => (string) ($doc->passagerPseudo ?? ''),
                'note' => (int) $doc->note,
                'commentaire' => (string) $doc->commentaire,
                'isProblem' => (bool) ($doc->isProblem ?? false),
            ];
        }

        return $this->json(['items' => $items]);
    }

    #[Route('/{id}/approve', methods: ['POST'])]
    public function approve(string $id, MongoProvider $mongo): JsonResponse
    {
        $res = $mongo->avisCollection()->updateOne(
            ['_id' => new ObjectId($id), 'status' => 'PENDING'],
            ['$set' => ['status' => 'APPROVED', 'validatedAt' => new \MongoDB\BSON\UTCDateTime()]]
        );

        if ($res->getMatchedCount() === 0) {
            return $this->json(['message' => 'Avis introuvable ou déjà traité'], 404);
        }

        return $this->json(['message' => 'Avis validé.']);
    }

    #[Route('/{id}/reject', methods: ['POST'])]
    public function reject(string $id, MongoProvider $mongo): JsonResponse
    {
        $res = $mongo->avisCollection()->updateOne(
            ['_id' => new ObjectId($id), 'status' => 'PENDING'],
            ['$set' => ['status' => 'REJECTED', 'validatedAt' => new \MongoDB\BSON\UTCDateTime()]]
        );

        if ($res->getMatchedCount() === 0) {
            return $this->json(['message' => 'Avis introuvable ou déjà traité'], 404);
        }

        return $this->json(['message' => 'Avis refusé.']);
    }
}