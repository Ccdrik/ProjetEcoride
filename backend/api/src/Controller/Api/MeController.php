<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller permettant de gérer les informations
 * de l'utilisateur actuellement connecté.
 *
 * J'ai mis ici :
 * - GET /api/me : récupérer mon profil (solde crédits, rôles, etc.)
 * - DELETE /api/me : anonymiser mon compte (conformité RGPD)
 *
 * Niveau sécurité :
 * - toutes les routes ici demandent ROLE_USER (donc utilisateur authentifié)
 */
final class MeController extends AbstractController
{
    /**
     * GET /api/me
     *
     * Permet au front de récupérer les informations
     * de l'utilisateur connecté via JWT.
     *
     * Utile pour :
     * - afficher le solde de crédits
     * - adapter l'interface selon le rôle
     */
    #[IsGranted('ROLE_USER')]
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function recupererUtilisateurConnecte(): JsonResponse
    {
        // Grâce au JWT, Symfony me donne l'utilisateur connecté via getUser()
        $utilisateur = $this->getUser();

        // Sécurité : on vérifie bien que c'est mon entité Utilisateur
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        // Je ne renvoie que les infos utiles pour le front
        return $this->json([
            'id' => $utilisateur->getId(),
            'email' => $utilisateur->getEmail(),
            'nom' => $utilisateur->getNom(),
            'prenom' => $utilisateur->getPrenom(),
            'rolePrincipal' => $utilisateur->getRole(),
            'roles' => $utilisateur->getRoles(),
            'soldeCredits' => $utilisateur->getSoldeCredits(),
            'avatar' => $utilisateur->getAvatar(),
        ]);
    }

    /**
     * DELETE /api/me
     *
     * Permet à un utilisateur de demander la suppression de son compte.
     *
     * Pour rester cohérent en base (réservations, transactions, trajets),
     * je ne supprime pas la ligne SQL, je fais une anonymisation :
     * - nom/prénom remplacés
     * - email remplacé par un email technique unique en .invalid
     * - mot de passe rendu inutilisable
     * - crédits remis à 0
     *
     * Objectif : conformité au droit à l’effacement (RGPD) + intégrité des données.
     */
    #[IsGranted('ROLE_USER')]
    #[Route('/api/me', name: 'api_me_delete', methods: ['DELETE'])]
    public function supprimerMonCompte(EntityManagerInterface $em): JsonResponse
    {
        $utilisateur = $this->getUser();

        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        // Je génère un UUID pour garantir un email unique (conflit unique en base évité)
        $uuid = Uuid::v4()->toRfc4122();

        // 1) Anonymisation des données personnelles
        $utilisateur->setNom('Utilisateur');
        $utilisateur->setPrenom('Supprimé');

        // Email technique non délivrable
        $utilisateur->setEmail('deleted_' . $utilisateur->getId() . '_' . $uuid . '@example.invalid');

        // Mot de passe rendu inutilisable (empêche de se reconnecter avec un ancien MDP)
        $utilisateur->setMotDePasseHash(password_hash($uuid, PASSWORD_BCRYPT));

        // Solde remis à zéro (choix projet)
        $utilisateur->setSoldeCredits(0);

        // Sauvegarde en base
        $em->flush();

        return $this->json([
            'message' => 'Compte anonymisé. Les données personnelles ont été supprimées.'
        ], 200);
    }

    #[IsGranted('ROLE_USER')]
    #[Route('/api/me/avatar', name: 'api_me_avatar_update', methods: ['PATCH'])]
    public function updateAvatar(
        Request $request,
        EntityManagerInterface $em
): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }   

        $data = json_decode($request->getContent() ?: '', true);

        if (!is_array($data)) {
            return $this->json(['message' => 'JSON invalide'], 400);
        }

        $avatar = trim((string) ($data['avatar'] ?? ''));

        $avatarsAutorises = [
            'passager.png',
            'passager(1).png',
            'passager(2).png',
            'chauffeur.png',
            'chauffeur(1).png',
            'chauffeur(2).png',
            'employe.png',
            'employe(1).png',
            'directeur.png',
        ];

        if (!in_array($avatar, $avatarsAutorises, true)) {
            return $this->json(['message' => 'Avatar non autorisé'], 400);
        }

        $user->setAvatar($avatar);
        $em->flush();

        return $this->json([
            'message' => 'Avatar mis à jour',
            'avatar' => $user->getAvatar(),
        ], 200);
}
}