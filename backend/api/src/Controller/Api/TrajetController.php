<?php

namespace App\Controller\Api;

use App\Entity\Trajet;
use App\Repository\TrajetRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class TrajetController extends AbstractController
{
    #[IsGranted('ROLE_CHAUFFEUR')]
    #[Route('/api/trajets', name: 'api_trajet_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['message' => 'Données invalides'], 400);
        }

        if (
            empty($data['departVille']) ||
            empty($data['arriveeVille']) ||
            empty($data['dateDepart']) ||
            !isset($data['prixParPlace']) ||
            !isset($data['placesTotal'])
        ) {
            return $this->json(['message' => 'Champs obligatoires manquants'], 400);
        }

        $trajet = new Trajet();

        $trajet->setDepartVille($data['departVille']);
        $trajet->setArriveeVille($data['arriveeVille']);
        $trajet->setDateDepart(new \DateTimeImmutable($data['dateDepart']));
        $trajet->setPrixParPlace((int) $data['prixParPlace']);
        $trajet->setPlacesTotal((int) $data['placesTotal']);
        $trajet->setPlacesRestantes((int) $data['placesTotal']);
        $trajet->setStatut('PLANIFIE');
        $trajet->setConducteur($this->getUser());

        $em->persist($trajet);
        $em->flush();

        return $this->json([
            'message' => 'Trajet créé',
            'id' => $trajet->getId()
        ], 201);
    }

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
                    'avatar' => $t->getConducteur()->getAvatar()
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
                'avatar' => $trajet->getConducteur()->getAvatar(),
            ] : null,
            'vehicule' => $trajet->getVehicule() ? [
                'id' => $trajet->getVehicule()->getId(),
                'marque' => $trajet->getVehicule()->getMarque(),
                'modele' => $trajet->getVehicule()->getModele(),
                'energie' => $trajet->getVehicule()->getEnergie(),
                'couleur' => $trajet->getVehicule()->getCouleur(),
                'immatriculation' => $trajet->getVehicule()->getImmatriculation(),
            ] : null,
        ]);
    }

    #[IsGranted('ROLE_CHAUFFEUR')]
    #[Route('/api/trajets/{id}/terminer', name: 'api_trajet_terminer', methods: ['PATCH'])]
    public function terminer(
        int $id,
        TrajetRepository $trajets,
        EntityManagerInterface $em
    ): JsonResponse {
        $trajet = $trajets->find($id);

        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $user = $this->getUser();

        if ($trajet->getConducteur()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        if ($trajet->getStatut() === 'TERMINE') {
            return $this->json(['message' => 'Ce trajet est déjà terminé'], 400);
        }
        

        $trajet->setStatut('TERMINE');
        $em->flush();

        return $this->json([
            'message' => 'Trajet terminé',
            'statut' => $trajet->getStatut()
        ]);
    }
}