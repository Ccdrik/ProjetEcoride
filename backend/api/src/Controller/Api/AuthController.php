<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Controller d'authentification "simple" (MVP).
 *
 * Objectif :
 * - recevoir email + password
 * - vérifier l'utilisateur en base
 * - vérifier le mot de passe
 * - renvoyer un token JWT
 *
 * Bonus sécurité :
 * - si le compte est suspendu, je bloque le login (403)
 */
final class AuthController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UtilisateurRepository $users,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface $jwt
    ): JsonResponse {
        // 1) Je lis le JSON envoyé par le client
        $data = json_decode($request->getContent() ?: '', true);

        // 2) Je sécurise : email + password obligatoires
        if (!is_array($data) || empty($data['email']) || empty($data['password'])) {
            return $this->json(['message' => 'email et password requis'], 400);
        }

        // 3) Je récupère l'utilisateur par email
        $user = $users->findOneBy(['email' => $data['email']]);

        // Pour ne pas donner d'indice, je renvoie le même message si email ou mdp incorrect
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Identifiants invalides'], 401);
        }

        // 4) Si le compte est suspendu : je bloque direct (US13)
        // -> un compte suspendu ne doit plus pouvoir se connecter
        if (method_exists($user, 'isSuspended') && $user->isSuspended()) {
            return $this->json([
                'message' => 'Compte suspendu. Contactez un administrateur.'
            ], 403);
        }

        // 5) Vérification du mot de passe (hash Symfony)
        if (!$hasher->isPasswordValid($user, (string) $data['password'])) {
            return $this->json(['message' => 'Identifiants invalides'], 401);
        }

        // 6) OK : je génère un JWT et je le renvoie
        return $this->json(['token' => $jwt->create($user)]);
    }
}