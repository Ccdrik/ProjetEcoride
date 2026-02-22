<?php

namespace App\Security;

use App\Entity\Utilisateur;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * UserChecker personnalisé pour EcoRide.
 *
 * Rôle :
 * Symfony appelle automatiquement ce service
 * à chaque authentification (y compris avec un JWT déjà valide).
 *
 * Objectif :
 * Empêcher un utilisateur suspendu par un admin
 * d’accéder à l’API même si son token JWT n’est pas encore expiré.
 *
 * → Sécurité importante : le token seul ne suffit pas,
 *   on re-vérifie l’état du compte en base.
 */
final class UserChecker implements UserCheckerInterface
{
    /**
     * Méthode exécutée AVANT la validation finale de l’authentification.
     *
     * Si une exception est lancée ici,
     * l’accès est immédiatement refusé.
     */
    public function checkPreAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
        // On vérifie qu’on travaille bien avec notre entité Utilisateur
        if (!$user instanceof Utilisateur) {
            return;
        }

        // Si le compte est suspendu par un administrateur
        if ($user->isSuspended()) {

            // On bloque l'accès avec un message clair
            // Cette exception est transformée en réponse HTTP (401/403 selon config)
            throw new CustomUserMessageAccountStatusException('Compte suspendu.');
        }
    }

    /**
     * Méthode exécutée APRÈS authentification.
     *
     * Ici nous n’avons rien de particulier à vérifier,
     * mais la méthode doit exister pour respecter l’interface.
     */
    public function checkPostAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
        // Rien à faire pour le moment
    }
}