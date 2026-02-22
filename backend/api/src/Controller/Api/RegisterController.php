<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Inscription d’un utilisateur (public).
 *
 * IMPORTANT :
 * - On n’autorise PAS la création de ROLE_ADMIN / ROLE_EMPLOYE par l’inscription.
 * - Rôles autorisés : ROLE_PASSAGER ou ROLE_CHAUFFEUR.
 * - Mot de passe toujours hashé.
 *
 * Mini sécurité ajoutée :
 * - Email valide (format)
 * - Mot de passe robuste (regex)
 */
#[Route('/api')]
final class RegisterController extends AbstractController
{
    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(
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
        $role = trim((string)($data['role'] ?? 'ROLE_PASSAGER'));

        if ($email === '' || $password === '' || $nom === '' || $prenom === '') {
            return $this->json(['message' => 'email, password, nom, prenom sont obligatoires'], 400);
        }

        // ✅ Validation email (format)
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email invalide'], 400);
        }

        // ✅ Validation mot de passe robuste
        // - 8 caractères mini
        // - 1 majuscule
        // - 1 minuscule
        // - 1 chiffre
        // - 1 caractère spécial
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/', $password)) {
            return $this->json([
                'message' => 'Mot de passe invalide : 8 caractères minimum, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.'
            ], 400);
        }

        // Sécurité : rôles autorisés à l’inscription
        $rolesAutorises = ['ROLE_PASSAGER', 'ROLE_CHAUFFEUR'];
        if (!in_array($role, $rolesAutorises, true)) {
            return $this->json([
                'message' => 'Rôle invalide. Rôles autorisés : ROLE_PASSAGER, ROLE_CHAUFFEUR'
            ], 400);
        }

        // Sécurité : éviter doublon email
        if ($users->findOneBy(['email' => $email])) {
            return $this->json(['message' => 'Email déjà utilisé'], 409);
        }

        $u = new Utilisateur();
        $u->setEmail($email);
        $u->setNom($nom);
        $u->setPrenom($prenom);
        $u->setRole($role);

        // Compte actif par défaut
        $u->setIsSuspended(false);

        // Crédits init (choix projet) : adapte si besoin
        $u->setSoldeCredits(20);

        // Hash password
        $hash = $hasher->hashPassword($u, $password);
        $u->setMotDePasseHash($hash);

        $em->persist($u);
        $em->flush();

        return $this->json([
            'message' => 'Compte créé',
            'utilisateur' => [
                'id' => $u->getId(),
                'email' => $u->getEmail(),
                'nom' => $u->getNom(),
                'prenom' => $u->getPrenom(),
                'rolePrincipal' => $u->getRole(),
                'roles' => $u->getRoles(),
                'soldeCredits' => $u->getSoldeCredits(),
            ],
        ], 201);
    }
}