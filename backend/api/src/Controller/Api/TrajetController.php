<?php

namespace App\Controller\Api;

use App\Entity\Trajet;
use App\Repository\TrajetRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class TrajetController extends AbstractController
{
    #[Route('/api/trajets', name: 'api_trajets_list', methods: ['GET'])]
    public function list(TrajetRepository $trajets): JsonResponse
    {
        $items = $trajets->findBy(
            ['statut' => 'OUVERT'],
            ['dateDepart' => 'ASC']
        );

        $data = array_map(static function (Trajet $t) {
            return [
                'id' => $t->getId(),
                'departVille' => $t->getDepartVille(),
                'arriveeVille' => $t->getArriveeVille(),
                'dateDepart' => $t->getDateDepart()->format('c'),
                'prixParPlace' => $t->getPrixParPlace(),
                'placesRestantes' => $t->getPlacesRestantes(),
                'statut' => $t->getStatut(),
                'conducteurId' => $t->getConducteur()?->getId(),
            ];
        }, $items);

        return $this->json($data);
    }

    #[Route('/api/trajets/{id}', name: 'api_trajet_show', methods: ['GET'])]
    public function show(int $id, TrajetRepository $trajets): JsonResponse
    {
        $trajet = $trajets->find($id);

        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        return $this->json([
            'id' => $trajet->getId(),
            'departVille' => $trajet->getDepartVille(),
            'arriveeVille' => $trajet->getArriveeVille(),
            'dateDepart' => $trajet->getDateDepart()->format('c'),
            'prixParPlace' => $trajet->getPrixParPlace(),
            'placesTotal' => $trajet->getPlacesTotal(),
            'placesRestantes' => $trajet->getPlacesRestantes(),
            'statut' => $trajet->getStatut(),
            'conducteurId' => $trajet->getConducteur()?->getId(),
        ]);
    }
}
