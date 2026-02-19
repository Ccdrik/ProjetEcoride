<?php

namespace App\Controller\Api;

use App\Repository\UtilisateurRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
     #[Route('/api/login', name: 'api_login', methods: ['POST'])]
        public function login(
    Request $request,
    UtilisateurRepository $users,
    UserPasswordHasherInterface $hasher,
    JWTTokenManagerInterface $jwt
    ): JsonResponse {

    
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || empty($data['email']) || empty($data['password'])) {
            return $this->json(['message' => 'email et password requis'], 400);
        }

        $user = $users->findOneBy(['email' => $data['email']]);

        if (!$user) {
            return $this->json(['message' => 'Identifiants invalides'], 401);
        }

        // IMPORTANT: ton Utilisateur doit implémenter PasswordAuthenticatedUserInterface
        if (!$hasher->isPasswordValid($user, $data['password'])) {
            return $this->json(['message' => 'Identifiants invalides'], 401);
        }

        return $this->json(['token' => $jwt->create($user)]);
    }
}
