<?php

namespace App\Controller\Api;

use App\Entity\Utilisateur;
use App\Entity\Vehicule;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Controller permettant de gérer les informations
 * de l'utilisateur actuellement connecté.
 *
 * J'ai mis ici :
 * - GET /api/me : récupérer mon profil
 * - PATCH /api/me : modifier mes informations
 * - DELETE /api/me : anonymiser mon compte
 * - PATCH /api/me/avatar : modifier l'avatar
 * - GET /api/me/vehicules : lister mes véhicules
 * - POST /api/me/vehicules : ajouter un véhicule
 */
final class MeController extends AbstractController
{
    #[IsGranted('ROLE_USER')]
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
            'avatar' => $utilisateur->getAvatar(),
        ]);
    }

    #[IsGranted('ROLE_USER')]
#[Route('/api/me', name: 'api_me_update', methods: ['PATCH'])]
public function modifierMesInformations(
    Request $request,
    UtilisateurRepository $users,
    EntityManagerInterface $em,
    UserPasswordHasherInterface $hasher
): JsonResponse {
    $user = $this->getUser();

    if (!$user instanceof Utilisateur) {
        return $this->json(['message' => 'Non authentifié'], 401);
    }

    $data = json_decode($request->getContent() ?: '', true);

    if (!is_array($data)) {
        return $this->json(['message' => 'JSON invalide'], 400);
    }

    if (array_key_exists('nom', $data)) {
        $nom = trim((string) $data['nom']);

        if ($nom === '') {
            return $this->json(['message' => 'Le nom ne peut pas être vide'], 400);
        }

        $user->setNom($nom);
    }

    if (array_key_exists('prenom', $data)) {
        $prenom = trim((string) $data['prenom']);

        if ($prenom === '') {
            return $this->json(['message' => 'Le prénom ne peut pas être vide'], 400);
        }

        $user->setPrenom($prenom);
    }

    if (array_key_exists('email', $data)) {
        $email = trim((string) $data['email']);

        if ($email === '') {
            return $this->json(['message' => 'L’email ne peut pas être vide'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email invalide'], 400);
        }

        $existingUser = $users->findOneBy(['email' => $email]);
        if ($existingUser instanceof Utilisateur && $existingUser->getId() !== $user->getId()) {
            return $this->json(['message' => 'Email déjà utilisé'], 409);
        }

        $user->setEmail($email);
    }

    if (array_key_exists('motDePasse', $data) && trim((string) $data['motDePasse']) !== '') {
        $motDePasse = (string) $data['motDePasse'];

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/', $motDePasse)) {
            return $this->json([
                'message' => 'Mot de passe invalide : 8 caractères minimum, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.'
            ], 400);
        }

        $user->setMotDePasseHash(
            $hasher->hashPassword($user, $motDePasse)
        );
    }

    $em->flush();

    return $this->json([
        'message' => 'Informations mises à jour',
        'utilisateur' => [
            'id' => $user->getId(),
            'nom' => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'email' => $user->getEmail(),
            'avatar' => $user->getAvatar(),
            'soldeCredits' => $user->getSoldeCredits(),
        ]
    ], 200);
}

    #[IsGranted('ROLE_USER')]
    #[Route('/api/me', name: 'api_me_delete', methods: ['DELETE'])]
    public function supprimerMonCompte(EntityManagerInterface $em): JsonResponse
    {
        $utilisateur = $this->getUser();

        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        $uuid = Uuid::v4()->toRfc4122();

        $utilisateur->setNom('Utilisateur');
        $utilisateur->setPrenom('Supprimé');
        $utilisateur->setEmail('deleted_' . $utilisateur->getId() . '_' . $uuid . '@example.invalid');
        $utilisateur->setMotDePasseHash(password_hash($uuid, PASSWORD_BCRYPT));
        $utilisateur->setSoldeCredits(0);

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

    #[IsGranted('ROLE_USER')]
    #[Route('/api/me/vehicules', name: 'api_me_vehicules_list', methods: ['GET'])]
    public function listerMesVehicules(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if (!in_array('ROLE_CHAUFFEUR', $user->getRoles(), true)) {
            return $this->json(['message' => 'Accès réservé aux chauffeurs'], 403);
        }

        $items = $user->getVehicules()->map(static function (Vehicule $vehicule) {
            return [
                'id' => $vehicule->getId(),
                'marque' => $vehicule->getMarque(),
                'modele' => $vehicule->getModele(),
                'energie' => $vehicule->getEnergie(),
                'couleur' => $vehicule->getCouleur(),
                'immatriculation' => $vehicule->getImmatriculation(),
                'nbPlaces' => $vehicule->getNbPlaces(),
            ];
        })->toArray();

        return $this->json($items, 200);
    }

    #[IsGranted('ROLE_USER')]
    #[Route('/api/me/vehicules', name: 'api_me_vehicules_create', methods: ['POST'])]
    public function creerVehicule(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        if (!in_array('ROLE_CHAUFFEUR', $user->getRoles(), true)) {
            return $this->json(['message' => 'Accès réservé aux chauffeurs'], 403);
        }

        $data = json_decode($request->getContent() ?: '', true);

        if (!is_array($data)) {
            return $this->json(['message' => 'JSON invalide'], 400);
        }

        $marque = trim((string) ($data['marque'] ?? ''));
        $modele = trim((string) ($data['modele'] ?? ''));
        $energie = trim((string) ($data['energie'] ?? ''));
        $couleur = trim((string) ($data['couleur'] ?? ''));
        $immatriculation = trim((string) ($data['immatriculation'] ?? ''));
        $nbPlaces = isset($data['nbPlaces']) && $data['nbPlaces'] !== ''
            ? (int) $data['nbPlaces']
            : null;

        if ($marque === '' || $modele === '' || $energie === '') {
            return $this->json(['message' => 'marque, modele et energie sont obligatoires'], 400);
        }

        $vehicule = new Vehicule();
        $vehicule->setMarque($marque);
        $vehicule->setModele($modele);
        $vehicule->setEnergie($energie);
        $vehicule->setCouleur($couleur !== '' ? $couleur : null);
        $vehicule->setImmatriculation($immatriculation !== '' ? $immatriculation : null);
        $vehicule->setNbPlaces($nbPlaces);
        $vehicule->setProprietaire($user);

        $em->persist($vehicule);
        $em->flush();

        return $this->json([
            'message' => 'Véhicule ajouté',
            'vehicule' => [
                'id' => $vehicule->getId(),
                'marque' => $vehicule->getMarque(),
                'modele' => $vehicule->getModele(),
                'energie' => $vehicule->getEnergie(),
                'couleur' => $vehicule->getCouleur(),
                'immatriculation' => $vehicule->getImmatriculation(),
                'nbPlaces' => $vehicule->getNbPlaces(),
            ]
        ], 201);
    }
}