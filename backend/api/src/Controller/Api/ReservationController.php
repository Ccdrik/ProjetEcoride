<?php

namespace App\Controller\Api;

use App\Service\ReservationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ReservationController extends AbstractController
{
    #[Route('/api/trajets/{id}/reservations', name: 'api_trajet_reservation_create', methods: ['POST'])]
    public function create(int $id, Request $request, ReservationService $service): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Non authentifié.'], 401);
        }

        $payload = json_decode($request->getContent() ?: '{}', true);

        $nbPlaces = (int) ($payload['nbPlaces'] ?? 1);

        try {
            $reservation = $service->reserver($id, $user, $nbPlaces);

            return $this->json([
                'message' => 'Réservation créée.',
                'reservation' => [
                    'id' => $reservation->getId(),
                    'trajetId' => $reservation->getTrajet()?->getId(),
                    'nbPlaces' => $reservation->getNbPlaces(),
                    'statut' => $reservation->getStatut(),
                    'dateCreation' => $reservation->getDateCreation()?->format(DATE_ATOM),
                ],
            ], 201);

        } catch (\RuntimeException $e) {
            return $this->json(['message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur serveur.'], 500);
        }
    }
}
