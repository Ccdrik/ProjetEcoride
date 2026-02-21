<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

/**
 * Controller permettant de gérer les informations
 * de l'utilisateur actuellement connecté.
 *
 * Ce controller contient :
 * - la récupération du profil (GET /api/me)
 * - la suppression/anonymisation du compte (DELETE /api/me)
 *
 * L'objectif est d'être conforme au droit à l'effacement (RGPD),
 * tout en conservant l'intégrité des données liées (réservations, trajets).
 */
final class MeController extends AbstractController
{
    /**
     * GET /api/me
     *
     * Permet au front de récupérer les informations
     * de l'utilisateur connecté via JWT.
     *
     * Cela permet notamment :
     * - d'afficher le nom
     * - d'afficher le solde de crédits
     * - d'adapter l'interface selon le rôle
     */
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function recupererUtilisateurConnecte(): JsonResponse
    {
        $utilisateur = $this->getUser();

        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        return $this->json([
            'id' => $utilisateur->getId(),
            'email' => $utilisateur->getEmail(),
            'nom' => $utilisateur->getNom(),
            'prenom' => $utilisateur->getPrenom(),
            'rolePrincipal' => $utilisateur->getRole(),
            'roles' => $utilisateur->getRoles(),
            'soldeCredits' => $utilisateur->getSoldeCredits(),
        ]);
    }

    /**
     * DELETE /api/me
     *
     * Permet à un utilisateur de supprimer son compte.
     *
     * Par conformité RGPD, je ne supprime pas physiquement
     * l'utilisateur de la base de données pour éviter
     * de casser les relations (réservations, transactions).
     *
     * Je procède donc à une anonymisation complète :
     * - suppression des données personnelles
     * - email remplacé par un email invalide unique
     * - mot de passe rendu inutilisable
     * - solde crédits remis à 0
     */
    #[Route('/api/me', name: 'api_me_delete', methods: ['DELETE'])]
    public function supprimerMonCompte(EntityManagerInterface $em): JsonResponse
    {
        $utilisateur = $this->getUser();

        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        // Génération d'un identifiant unique pour éviter doublons email
        $uuid = Uuid::v4()->toRfc4122();

        // 1) Anonymisation des données personnelles
        $utilisateur->setNom('Utilisateur');
        $utilisateur->setPrenom('Supprimé');

        // Remplacement de l'email par un email technique non délivrable
        $utilisateur->setEmail(
            'deleted_' . $utilisateur->getId() . '_' . $uuid . '@example.invalid'
        );

        // Remplacement du mot de passe par une valeur aléatoire
        // afin d'empêcher toute reconnexion
        $utilisateur->setMotDePasseHash(
            password_hash($uuid, PASSWORD_BCRYPT)
        );

        // Réinitialisation des crédits
        $utilisateur->setSoldeCredits(0);

        // On enregistre les modifications
        $em->flush();

        return $this->json([
            'message' => 'Compte anonymisé. Les données personnelles ont été supprimées.'
        ]);
    }
}