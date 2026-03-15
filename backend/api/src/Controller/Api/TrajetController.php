<?php

namespace App\Controller\Api;

use App\Entity\Trajet;
use App\Entity\TransactionCredit;
use App\Entity\Utilisateur;
use App\Repository\ReservationRepository;
use App\Repository\TrajetRepository;
use App\Repository\VehiculeRepository;
use App\Service\Mongo\MongoProvider;
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
        EntityManagerInterface $em,
        VehiculeRepository $vehicules
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
            !isset($data['placesTotal']) ||
            !isset($data['vehiculeId'])
        ) {
            return $this->json(['message' => 'Champs obligatoires manquants'], 400);
        }

        $user = $this->getUser();
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ((int) $data['prixParPlace'] < 2) {
            return $this->json(['message' => 'Le prix par place doit être au minimum de 2 crédits'], 400);
        }

        $vehicule = $vehicules->find((int) $data['vehiculeId']);

        if (!$vehicule) {
            return $this->json(['message' => 'Véhicule introuvable'], 404);
        }

        if ($vehicule->getProprietaire()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Ce véhicule ne vous appartient pas'], 403);
        }

        $trajet = new Trajet();

        $trajet->setDepartVille($data['departVille']);
        $trajet->setArriveeVille($data['arriveeVille']);

        $dateDepart = \DateTimeImmutable::createFromFormat(
            'Y-m-d\TH:i',
            $data['dateDepart'],
            new \DateTimeZone('Europe/Paris')
        );

        if (!$dateDepart) {
            return $this->json(['message' => 'Date de départ invalide'], 400);
        }

        $trajet->setDateDepart($dateDepart);
        $trajet->setPrixParPlace((int) $data['prixParPlace']);
        $trajet->setPlacesTotal((int) $data['placesTotal']);
        $trajet->setPlacesRestantes((int) $data['placesTotal']);
        $trajet->setStatut('PLANIFIE');
        $trajet->setConducteur($user);
        $trajet->setVehicule($vehicule);

        $em->persist($trajet);
        $em->flush();

        return $this->json([
            'message' => 'Trajet créé',
            'id' => $trajet->getId()
        ], 201);
    }

    #[Route('/api/trajets', methods: ['GET'])]
    public function list(
        Request $request,
        TrajetRepository $trajets,
        MongoProvider $mongo
    ): JsonResponse {
        $filters = [
            'depart' => $request->query->get('depart'),
            'arrivee' => $request->query->get('arrivee'),
            'date' => $request->query->get('date'),
            'prixMax' => $request->query->get('prixMax'),
            'eco' => $request->query->get('eco'),
        ];

        $items = $trajets->search($filters);

        $data = array_map(function ($t) use ($mongo) {
            $noteMoyenne = null;
            $chauffeur = $t->getConducteur();

            if ($chauffeur) {
                $pipeline = [
                    [
                        '$match' => [
                            'chauffeurId' => $chauffeur->getId(),
                            'status' => 'VALIDE',
                        ]
                    ],
                    [
                        '$group' => [
                            '_id' => null,
                            'moyenne' => ['$avg' => '$note'],
                        ]
                    ]
                ];

                $result = $mongo->avisCollection()->aggregate($pipeline)->toArray();

                if (!empty($result) && isset($result[0]->moyenne)) {
                    $noteMoyenne = round((float) $result[0]->moyenne, 1);
                }
            }

            return [
                'id' => $t->getId(),
                'departVille' => $t->getDepartVille(),
                'arriveeVille' => $t->getArriveeVille(),
                'dateDepart' => $t->getDateDepart()->format('c'),
                'prixParPlace' => $t->getPrixParPlace(),
                'placesRestantes' => $t->getPlacesRestantes(),
                'ecologique' => $this->estEcologique($t),
                'noteMoyenne' => $noteMoyenne,
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
    public function show(
        int $id,
        TrajetRepository $trajets,
        ReservationRepository $reservations,
        MongoProvider $mongo
    ): JsonResponse {
        $trajet = $trajets->find($id);

        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        $avisDejaLaisse = false;
        $reservationId = null;
        $noteMoyenne = null;

        $user = $this->getUser();

        if ($user instanceof Utilisateur) {
            $reservation = $reservations->findOneBy([
                'trajet' => $trajet,
                'passager' => $user,
            ]);

            if ($reservation) {
                $reservationId = $reservation->getId();

                $existing = $mongo->avisCollection()->findOne([
                    'reservationId' => $reservationId,
                ]);

                $avisDejaLaisse = $existing !== null;
            }
        }

        $chauffeur = $trajet->getConducteur();

        if ($chauffeur) {
            $pipeline = [
                [
                    '$match' => [
                        'chauffeurId' => $chauffeur->getId(),
                        'status' => 'VALIDE',
                    ]
                ],
                [
                    '$group' => [
                        '_id' => null,
                        'moyenne' => ['$avg' => '$note'],
                    ]
                ]
            ];

            $result = $mongo->avisCollection()->aggregate($pipeline)->toArray();

            if (!empty($result) && isset($result[0]->moyenne)) {
                $noteMoyenne = round((float) $result[0]->moyenne, 1);
            }
        }

        return $this->json([
            'id' => $trajet->getId(),
            'departVille' => $trajet->getDepartVille(),
            'arriveeVille' => $trajet->getArriveeVille(),
            'dateDepart' => $trajet->getDateDepart()->format('c'),
            'prixParPlace' => $trajet->getPrixParPlace(),
            'placesTotal' => $trajet->getPlacesTotal(),
            'placesRestantes' => $trajet->getPlacesRestantes(),
            'ecologique' => $this->estEcologique($trajet),
            'statut' => $trajet->getStatut(),
            'avisDejaLaisse' => $avisDejaLaisse,
            'reservationId' => $reservationId,
            'noteMoyenne' => $noteMoyenne,
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
    #[Route('/api/trajets/{id}', name: 'api_trajet_update', methods: ['PATCH'])]
    public function update(
        int $id,
        Request $request,
        TrajetRepository $trajets,
        EntityManagerInterface $em,
        VehiculeRepository $vehicules
    ): JsonResponse {
        $trajet = $trajets->find($id);

        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $user = $this->getUser();
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ($trajet->getConducteur()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        if (in_array($trajet->getStatut(), ['EN_COURS', 'TERMINE', 'ANNULE'], true)) {
            return $this->json(['message' => 'Ce trajet ne peut plus être modifié'], 409);
        }

        $data = json_decode($request->getContent() ?: '', true);

        if (!is_array($data)) {
            return $this->json(['message' => 'JSON invalide'], 400);
        }

        if (array_key_exists('departVille', $data)) {
            $departVille = trim((string) $data['departVille']);
            if ($departVille === '') {
                return $this->json(['message' => 'departVille ne peut pas être vide'], 400);
            }
            $trajet->setDepartVille($departVille);
        }

        if (array_key_exists('arriveeVille', $data)) {
            $arriveeVille = trim((string) $data['arriveeVille']);
            if ($arriveeVille === '') {
                return $this->json(['message' => 'arriveeVille ne peut pas être vide'], 400);
            }
            $trajet->setArriveeVille($arriveeVille);
        }

        if (array_key_exists('dateDepart', $data)) {
            $dateDepart = \DateTimeImmutable::createFromFormat(
                'Y-m-d\TH:i',
                (string) $data['dateDepart'],
                new \DateTimeZone('Europe/Paris')
            );

            if (!$dateDepart) {
                return $this->json(['message' => 'Date de départ invalide'], 400);
            }

            $trajet->setDateDepart($dateDepart);
        }

        if (array_key_exists('prixParPlace', $data)) {
            $prixParPlace = (int) $data['prixParPlace'];

            if ($prixParPlace < 2) {
                return $this->json(['message' => 'Le prix par place doit être au minimum de 2 crédits'], 400);
            }

            $trajet->setPrixParPlace($prixParPlace);
        }

        if (array_key_exists('placesTotal', $data)) {
            $nouveauPlacesTotal = (int) $data['placesTotal'];

            if ($nouveauPlacesTotal <= 0) {
                return $this->json(['message' => 'placesTotal doit être supérieur à 0'], 400);
            }

            $placesReservees = (int) $trajet->getPlacesTotal() - (int) $trajet->getPlacesRestantes();

            if ($nouveauPlacesTotal < $placesReservees) {
                return $this->json([
                    'message' => 'Impossible de définir un nombre de places inférieur aux places déjà réservées'
                ], 409);
            }

            $trajet->setPlacesTotal($nouveauPlacesTotal);
            $trajet->setPlacesRestantes($nouveauPlacesTotal - $placesReservees);
        }

        if (array_key_exists('vehiculeId', $data)) {
            $vehicule = $vehicules->find((int) $data['vehiculeId']);

            if (!$vehicule) {
                return $this->json(['message' => 'Véhicule introuvable'], 404);
            }

            if ($vehicule->getProprietaire()?->getId() !== $user->getId()) {
                return $this->json(['message' => 'Ce véhicule ne vous appartient pas'], 403);
            }

            $trajet->setVehicule($vehicule);
        }

        $em->flush();

        return $this->json([
            'message' => 'Trajet mis à jour',
            'trajet' => [
                'id' => $trajet->getId(),
                'departVille' => $trajet->getDepartVille(),
                'arriveeVille' => $trajet->getArriveeVille(),
                'dateDepart' => $trajet->getDateDepart()?->format('c'),
                'prixParPlace' => $trajet->getPrixParPlace(),
                'placesTotal' => $trajet->getPlacesTotal(),
                'placesRestantes' => $trajet->getPlacesRestantes(),
                'statut' => $trajet->getStatut(),
                'vehicule' => $trajet->getVehicule() ? [
                    'id' => $trajet->getVehicule()->getId(),
                    'marque' => $trajet->getVehicule()->getMarque(),
                    'modele' => $trajet->getVehicule()->getModele(),
                    'energie' => $trajet->getVehicule()->getEnergie(),
                ] : null,
            ],
        ], 200);
    }

    #[IsGranted('ROLE_CHAUFFEUR')]
    #[Route('/api/trajets/{id}/annuler', name: 'api_trajet_annuler', methods: ['PATCH'])]
    public function annuler(
        int $id,
        TrajetRepository $trajets,
        EntityManagerInterface $em
    ): JsonResponse {
        $trajet = $trajets->find($id);

        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $user = $this->getUser();
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ($trajet->getConducteur()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        if ($trajet->getStatut() === 'TERMINE') {
            return $this->json(['message' => 'Impossible d’annuler un trajet terminé'], 409);
        }

        if ($trajet->getStatut() === 'ANNULE') {
            return $this->json(['message' => 'Ce trajet est déjà annulé'], 409);
        }

        $nbReservationsAnnulees = 0;
        $creditsRembourses = 0;

        foreach ($trajet->getReservations() as $reservation) {
            if ($reservation->getStatut() !== 'CONFIRMEE') {
                continue;
            }

            $passager = $reservation->getPassager();
            if (!$passager instanceof Utilisateur) {
                continue;
            }

            $montant = ((int) $trajet->getPrixParPlace()) * ((int) $reservation->getNbPlaces());

            $passager->setSoldeCredits(
                ((int) $passager->getSoldeCredits()) + $montant
            );

            $reservation->setStatut('ANNULEE');

            $transaction = (new TransactionCredit())
                ->setUtilisateur($passager)
                ->setReservation($reservation)
                ->setTypeOperation('CREDIT')
                ->setMontant($montant)
                ->setMotif('Annulation trajet #' . $trajet->getId())
                ->setDateCreation(new \DateTimeImmutable());

            $em->persist($transaction);

            $nbReservationsAnnulees++;
            $creditsRembourses += $montant;
        }

        $trajet->setStatut('ANNULE');
        $trajet->setPlacesRestantes($trajet->getPlacesTotal());

        $em->flush();

        return $this->json([
            'message' => 'Trajet annulé',
            'trajet' => [
                'id' => $trajet->getId(),
                'statut' => $trajet->getStatut(),
                'placesRestantes' => $trajet->getPlacesRestantes(),
            ],
            'remboursements' => [
                'reservationsAnnulees' => $nbReservationsAnnulees,
                'creditsRembourses' => $creditsRembourses,
            ],
        ], 200);
    }

    #[IsGranted('ROLE_CHAUFFEUR')]
    #[Route('/api/trajets/{id}/demarrer', name: 'api_trajet_demarrer', methods: ['PATCH'])]
    public function demarrer(
        int $id,
        TrajetRepository $trajets,
        EntityManagerInterface $em
    ): JsonResponse {
        $trajet = $trajets->find($id);

        if (!$trajet) {
            return $this->json(['message' => 'Trajet introuvable'], 404);
        }

        $user = $this->getUser();
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ($trajet->getConducteur()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        if ($trajet->getStatut() === 'TERMINE') {
            return $this->json(['message' => 'Impossible de démarrer un trajet terminé'], 400);
        }

        if ($trajet->getStatut() === 'EN_COURS') {
            return $this->json(['message' => 'Ce trajet est déjà démarré'], 400);
        }

        $trajet->setStatut('EN_COURS');
        $em->flush();

        return $this->json([
            'message' => 'Trajet démarré',
            'statut' => $trajet->getStatut()
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
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if ($trajet->getConducteur()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        if ($trajet->getStatut() === 'TERMINE') {
            return $this->json(['message' => 'Ce trajet est déjà terminé'], 400);
        }

        $trajet->setStatut('TERMINE');

        $chauffeur = $trajet->getConducteur();
        $creditsAjoutes = 0;

        foreach ($trajet->getReservations() as $reservation) {
            if ($reservation->getStatut() !== 'CONFIRMEE') {
                continue;
            }

            if ($reservation->isCreditVerseAuChauffeur()) {
                continue;
            }

            $nbPlaces = (int) $reservation->getNbPlaces();
            $prixTotal = ((int) $trajet->getPrixParPlace()) * $nbPlaces;
            $commissionPlateforme = 2 * $nbPlaces;
            $gainChauffeur = $prixTotal - $commissionPlateforme;

            if ($gainChauffeur < 0) {
                continue;
            }

            $chauffeur->setSoldeCredits(
                ((int) $chauffeur->getSoldeCredits()) + $gainChauffeur
            );

            $transaction = (new TransactionCredit())
                ->setUtilisateur($chauffeur)
                ->setReservation($reservation)
                ->setTypeOperation('CREDIT_CHAUFFEUR')
                ->setMontant($gainChauffeur)
                ->setMotif('Gain trajet #' . $trajet->getId())
                ->setDateCreation(new \DateTimeImmutable());

            $reservation->setCreditVerseAuChauffeur(true);
            $creditsAjoutes += $gainChauffeur;

            $em->persist($transaction);
        }

        $em->flush();

        return $this->json([
            'message' => 'Trajet terminé',
            'statut' => $trajet->getStatut(),
            'creditsChauffeurAjoutes' => $creditsAjoutes,
            'soldeChauffeur' => $chauffeur?->getSoldeCredits(),
        ]);
    }

    private function estEcologique(Trajet $trajet): bool
    {
        $energie = strtolower($trajet->getVehicule()?->getEnergie() ?? '');

        return in_array($energie, [
            'electrique',
            'électrique',
            'hybride',
        ], true);
    }
}