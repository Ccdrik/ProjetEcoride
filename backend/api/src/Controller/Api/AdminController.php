<?php

namespace App\Controller\Api;

use App\Entity\Reservation;
use App\Entity\Utilisateur;
use App\Repository\ReservationRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[IsGranted('ROLE_ADMIN')]
#[Route('/api/admin')]
final class AdminController extends AbstractController
{
    #[Route('/employes', name: 'api_admin_employe_create', methods: ['POST'])]
    public function creerEmploye(
        Request $request,
        UtilisateurRepository $users,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent() ?: '', true);

        if (!is_array($data)) {
            return $this->json(['message' => 'JSON invalide'], 400);
        }

        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $nom = trim((string) ($data['nom'] ?? ''));
        $prenom = trim((string) ($data['prenom'] ?? ''));

        if ($email === '' || $password === '' || $nom === '' || $prenom === '') {
            return $this->json(['message' => 'email, password, nom, prenom sont obligatoires'], 400);
        }

        if ($users->findOneBy(['email' => $email])) {
            return $this->json(['message' => 'Email déjà utilisé'], 409);
        }

        $employe = new Utilisateur();
        $employe->setEmail($email);
        $employe->setNom($nom);
        $employe->setPrenom($prenom);
        $employe->setRole('ROLE_EMPLOYE');
        $employe->setSoldeCredits(999);
        $employe->setIsSuspended(false);

        $hash = $hasher->hashPassword($employe, $password);
        $employe->setMotDePasseHash($hash);

        $em->persist($employe);
        $em->flush();

        return $this->json([
            'message' => 'Employé créé',
            'employe' => [
                'id' => $employe->getId(),
                'email' => $employe->getEmail(),
                'nom' => $employe->getNom(),
                'prenom' => $employe->getPrenom(),
                'role' => $employe->getRole(),
                'isSuspended' => $employe->isSuspended(),
            ],
        ], 201);
    }

    #[Route('/utilisateurs/{id}/suspendre', name: 'api_admin_user_suspend', methods: ['PATCH'])]
    public function suspendreUtilisateur(
        int $id,
        UtilisateurRepository $users,
        EntityManagerInterface $em
    ): JsonResponse {
        $u = $users->find($id);
        if (!$u) {
            return $this->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $me = $this->getUser();
        if ($me instanceof Utilisateur && $me->getId() === $u->getId()) {
            return $this->json(['message' => 'Impossible de suspendre votre propre compte'], 400);
        }

        if ($u->isSuspended()) {
            return $this->json([
                'message' => 'Compte déjà suspendu',
                'utilisateur' => [
                    'id' => $u->getId(),
                    'email' => $u->getEmail(),
                    'isSuspended' => $u->isSuspended(),
                ],
            ], 200);
        }

        $u->setIsSuspended(true);
        $em->flush();

        return $this->json([
            'message' => 'Compte suspendu',
            'utilisateur' => [
                'id' => $u->getId(),
                'email' => $u->getEmail(),
                'isSuspended' => $u->isSuspended(),
            ],
        ], 200);
    }

    #[Route('/utilisateurs/{id}/reactiver', name: 'api_admin_user_reactivate', methods: ['PATCH'])]
    public function reactiverUtilisateur(
        int $id,
        UtilisateurRepository $users,
        EntityManagerInterface $em
    ): JsonResponse {
        $u = $users->find($id);
        if (!$u) {
            return $this->json(['message' => 'Utilisateur introuvable'], 404);
        }

        if (!$u->isSuspended()) {
            return $this->json([
                'message' => 'Compte déjà actif',
                'utilisateur' => [
                    'id' => $u->getId(),
                    'email' => $u->getEmail(),
                    'isSuspended' => $u->isSuspended(),
                ],
            ], 200);
        }

        $u->setIsSuspended(false);
        $em->flush();

        return $this->json([
            'message' => 'Compte réactivé',
            'utilisateur' => [
                'id' => $u->getId(),
                'email' => $u->getEmail(),
                'isSuspended' => $u->isSuspended(),
            ],
        ], 200);
    }

    #[Route('/stats/covoiturages-par-jour', name: 'api_admin_stats_covoit_jour', methods: ['GET'])]
    public function covoituragesParJour(ReservationRepository $reservations): JsonResponse
    {
        $items = $reservations->createQueryBuilder('r')
            ->join('r.trajet', 't')
            ->addSelect('t')
            ->where('r.statut = :s')
            ->setParameter('s', 'CONFIRMEE')
            ->getQuery()
            ->getResult();

        $parJour = [];

        foreach ($items as $r) {
            /** @var Reservation $r */
            $jour = $r->getTrajet()?->getDateDepart()?->format('Y-m-d') ?? 'inconnu';
            $parJour[$jour] = ($parJour[$jour] ?? 0) + (int) $r->getNbPlaces();
        }

        ksort($parJour);

        $data = [];
        foreach ($parJour as $jour => $nbPlaces) {
            $data[] = ['jour' => $jour, 'nbPlacesReservees' => $nbPlaces];
        }

        return $this->json($data, 200);
    }

    #[Route('/stats/gains-par-jour', name: 'api_admin_stats_gains_jour', methods: ['GET'])]
    public function gainsParJour(ReservationRepository $reservations): JsonResponse
    {
        $items = $reservations->createQueryBuilder('r')
            ->join('r.trajet', 't')
            ->addSelect('t')
            ->where('r.statut = :s')
            ->setParameter('s', 'CONFIRMEE')
            ->getQuery()
            ->getResult();

        $parJour = [];

        foreach ($items as $r) {
            /** @var Reservation $r */
            $jour = $r->getTrajet()?->getDateDepart()?->format('Y-m-d') ?? 'inconnu';
            $gain = 2 * (int) $r->getNbPlaces();
            $parJour[$jour] = ($parJour[$jour] ?? 0) + $gain;
        }

        ksort($parJour);

        $data = [];
        foreach ($parJour as $jour => $credits) {
            $data[] = ['jour' => $jour, 'creditsPlateforme' => $credits];
        }

        return $this->json($data, 200);
    }

    #[Route('/stats/gains-total', name: 'api_admin_stats_gains_total', methods: ['GET'])]
    public function gainsTotal(ReservationRepository $reservations): JsonResponse
    {
        $items = $reservations->findBy(['statut' => 'CONFIRMEE']);

        $total = 0;
        foreach ($items as $r) {
            /** @var Reservation $r */
            $total += 2 * (int) $r->getNbPlaces();
        }

        return $this->json(['creditsPlateformeTotal' => $total], 200);
    }

    #[Route('/utilisateurs', name: 'api_admin_users_list', methods: ['GET'])]
    public function listerUtilisateurs(UtilisateurRepository $users): JsonResponse
    {
        $items = $users->findBy([], ['id' => 'DESC']);

        $data = array_map(static function (Utilisateur $u) {
            return [
                'id' => $u->getId(),
                'nom' => $u->getNom(),
                'prenom' => $u->getPrenom(),
                'email' => $u->getEmail(),
                'role' => $u->getRole(),
                'isSuspended' => $u->isSuspended(),
            ];
        }, $items);

        return $this->json(['items' => $data], 200);
    }
}