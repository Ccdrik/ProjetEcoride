<?php

namespace App\Controller\Api;

use App\Entity\Trajet;
use App\Repository\TrajetRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class TrajetController extends AbstractController
{
   #[Route('/api/trajets', methods: ['GET'])]
public function list(Request $request, TrajetRepository $trajets): JsonResponse
{
    $filters = [
        'depart' => $request->query->get('depart'),
        'arrivee' => $request->query->get('arrivee'),
        'date' => $request->query->get('date'),
        'prixMax' => $request->query->get('prixMax'),
        'eco' => $request->query->get('eco'),
    ];

    $items = $trajets->search($filters);

    $data = array_map(function ($t) {
        return [
            'id' => $t->getId(),
            'departVille' => $t->getDepartVille(),
            'arriveeVille' => $t->getArriveeVille(),
            'dateDepart' => $t->getDateDepart()->format('c'),
            'prixParPlace' => $t->getPrixParPlace(),
            'placesRestantes' => $t->getPlacesRestantes(),
            'conducteur' => [
                'id' => $t->getConducteur()->getId(),
                'nom' => $t->getConducteur()->getNom(),
                'prenom' => $t->getConducteur()->getPrenom(),
            ],
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
            'conducteur' => $trajet->getConducteur() ? [
                    'id' => $trajet->getConducteur()->getId(),
                    'nom' => $trajet->getConducteur()->getNom(),
                    'prenom' => $trajet->getConducteur()->getPrenom(),
] : null,
        ]);
    }
}
