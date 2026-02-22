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

/**
 * Controller réservé à l'ADMIN (US13).
 *
 * Fonctions demandées dans le cahier des charges :
 * - créer des comptes employés
 * - suspendre / réactiver un compte (user ou employé)
 * - afficher des statistiques (covoiturages / gains)
 */
#[IsGranted('ROLE_ADMIN')]
#[Route('/api/admin')]
final class AdminController extends AbstractController
{
    /**
     * POST /api/admin/employes
     *
     * Crée un compte employé (un admin est créé en amont, pas par inscription).
     * Body attendu :
     * {
     *   "email": "employe3@ecoride.local",
     *   "password": "employe123",
     *   "nom": "Employe",
     *   "prenom": "Paul"
     * }
     */
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

        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $nom = trim((string)($data['nom'] ?? ''));
        $prenom = trim((string)($data['prenom'] ?? ''));

        if ($email === '' || $password === '' || $nom === '' || $prenom === '') {
            return $this->json(['message' => 'email, password, nom, prenom sont obligatoires'], 400);
        }

        // Sécurité : éviter doublon email
        if ($users->findOneBy(['email' => $email])) {
            return $this->json(['message' => 'Email déjà utilisé'], 409);
        }

        $employe = new Utilisateur();
        $employe->setEmail($email);
        $employe->setNom($nom);
        $employe->setPrenom($prenom);

        // Choix projet : rôle employé + crédits fixes
        $employe->setRole('ROLE_EMPLOYE');
        $employe->setSoldeCredits(999);

        // Bon réflexe : un employé créé n’est pas suspendu
        $employe->setIsSuspended(false);

        // Hash du mot de passe
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

    /**
     * PATCH /api/admin/utilisateurs/{id}/suspendre
     *
     * Suspension d'un compte (user ou employé).
     * Important : même si l’utilisateur a un JWT valide, le UserChecker le bloquera ensuite.
     */
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

        // Sécurité : empêcher l’admin connecté de se suspendre lui-même
        $me = $this->getUser();
        if ($me instanceof Utilisateur && $me->getId() === $u->getId()) {
            return $this->json(['message' => 'Impossible de suspendre votre propre compte'], 400);
        }

        // Si déjà suspendu, on ne refait pas une action inutile
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

    /**
     * PATCH /api/admin/utilisateurs/{id}/reactiver
     *
     * Réactive un compte suspendu.
     */
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

    /**
     * GET /api/admin/stats/covoiturages-par-jour
     *
     * Stats : nombre de places réservées par jour de départ.
     * (MVP : on compte les réservations CONFIRME par dateDepart du trajet.)
     */
    #[Route('/stats/covoiturages-par-jour', name: 'api_admin_stats_covoit_jour', methods: ['GET'])]
    public function covoituragesParJour(ReservationRepository $reservations): JsonResponse
    {
        $items = $reservations->createQueryBuilder('r')
            ->join('r.trajet', 't')
            ->addSelect('t')
            ->where('r.statut = :s')
            ->setParameter('s', 'CONFIRME')
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

    /**
     * GET /api/admin/stats/gains-par-jour
     *
     * Stats : crédits gagnés par la plateforme par jour.
     *
     * Choix MVP :
     * - 1 crédit plateforme par place réservée
     */
    #[Route('/stats/gains-par-jour', name: 'api_admin_stats_gains_jour', methods: ['GET'])]
    public function gainsParJour(ReservationRepository $reservations): JsonResponse
    {
        $items = $reservations->createQueryBuilder('r')
            ->join('r.trajet', 't')
            ->addSelect('t')
            ->where('r.statut = :s')
            ->setParameter('s', 'CONFIRME')
            ->getQuery()
            ->getResult();

        $parJour = [];

        foreach ($items as $r) {
            /** @var Reservation $r */
            $jour = $r->getTrajet()?->getDateDepart()?->format('Y-m-d') ?? 'inconnu';

            // Commission plateforme = 1 crédit par place
            $gain = (int) $r->getNbPlaces();

            $parJour[$jour] = ($parJour[$jour] ?? 0) + $gain;
        }

        ksort($parJour);

        $data = [];
        foreach ($parJour as $jour => $credits) {
            $data[] = ['jour' => $jour, 'creditsPlateforme' => $credits];
        }

        return $this->json($data, 200);
    }

    /**
     * GET /api/admin/stats/gains-total
     *
     * Total des crédits gagnés par la plateforme (même règle : 1 crédit/place).
     */
    #[Route('/stats/gains-total', name: 'api_admin_stats_gains_total', methods: ['GET'])]
    public function gainsTotal(ReservationRepository $reservations): JsonResponse
    {
        $items = $reservations->findBy(['statut' => 'CONFIRME']);

        $total = 0;
        foreach ($items as $r) {
            /** @var Reservation $r */
            $total += (int) $r->getNbPlaces();
        }

        return $this->json(['creditsPlateformeTotal' => $total], 200);
    }
}