<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Entité Utilisateur.
 *
 * Dans EcoRide, un utilisateur peut être :
 * - PASSAGER (réserve des trajets)
 * - CHAUFFEUR (publie des trajets + possède des véhicules)
 * - EMPLOYE (modère les avis / incidents)
 * - ADMIN (gère la plateforme + stats + création employés + suspension comptes)
 *
 * Je stocke :
 * - informations personnelles (nom, prénom, email)
 * - sécurité (mot de passe hashé)
 * - rôle principal (un rôle simple stocké en base)
 * - date de création
 * - solde de crédits
 *
 * Et les relations :
 * - trajets (si chauffeur)
 * - réservations (si passager)
 * - véhicules (si chauffeur)
 * - transactions de crédits (historique des débits/crédits)
 */
#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface
{
    /**
     * Identifiant technique (auto-incrémenté).
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Nom de famille de l'utilisateur.
     */
    #[ORM\Column(length: 80)]
    private ?string $nom = null;

    /**
     * Prénom de l'utilisateur.
     */
    #[ORM\Column(length: 80)]
    private ?string $prenom = null;

    /**
     * Email unique : sert aussi d'identifiant de connexion.
     */
    #[ORM\Column(length: 180, unique: true)]
    private ?string $email = null;

    /**
     * Mot de passe HASHÉ (jamais en clair).
     * Symfony utilise ce champ via getPassword().
     */
    #[ORM\Column(length: 255)]
    private ?string $motDePasseHash = null;

    /**
     * Rôle principal stocké en base.
     * Exemple : ROLE_ADMIN / ROLE_EMPLOYE / ROLE_PASSAGER / ROLE_CHAUFFEUR.
     *
     * Ensuite getRoles() ajoute toujours ROLE_USER.
     */
    #[ORM\Column(length: 20)]
    private ?string $role = null;

    /**
     * Date de création du compte.
     */
    #[ORM\Column]
    private \DateTimeImmutable $dateCreation;

    /**
     * Solde de crédits (monnaie interne).
     * Les admins/employés peuvent être initialisés à 999 via fixtures.
     */
    #[ORM\Column]
    private int $soldeCredits = 0;

    /**
     * Indique si le compte est suspendu par un administrateur (US13).
     *
     * Si true :
     *  - l'utilisateur ne doit plus pouvoir se connecter
     *  - l'utilisateur ne doit plus pouvoir réserver ou utiliser la plateforme
     *
     * Par défaut, un compte est actif (false).
     */
    #[ORM\Column(options: ['default' => false])]
    private bool $isSuspended = false;

    /**
     * Trajets publiés par cet utilisateur (s'il est chauffeur).
     *
     * @var Collection<int, Trajet>
     */
    #[ORM\OneToMany(targetEntity: Trajet::class, mappedBy: 'conducteur')]
    private Collection $trajets;

    /**
     * Réservations effectuées par cet utilisateur (s'il est passager).
     *
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'passager')]
    private Collection $reservations;

    /**
     * Véhicules possédés par cet utilisateur (s'il est chauffeur).
     *
     * @var Collection<int, Vehicule>
     */
    #[ORM\OneToMany(targetEntity: Vehicule::class, mappedBy: 'proprietaire')]
    private Collection $vehicules;

    /**
     * Historique des transactions de crédits (débit/crédit).
     *
     * @var Collection<int, TransactionCredit>
     */
    #[ORM\OneToMany(targetEntity: TransactionCredit::class, mappedBy: 'utilisateur')]
    private Collection $transactionsCredits;

    #[ORM\Column(length: 100, options: ['default' => 'passager.png'])]
    private string $avatar = 'passager.png';

    public function __construct()
    {
        // Je mets une date de création automatique à la construction.
        $this->dateCreation = new \DateTimeImmutable();

        // Collections Doctrine (relations)
        $this->trajets = new ArrayCollection();
        $this->reservations = new ArrayCollection();
        $this->vehicules = new ArrayCollection();
        $this->transactionsCredits = new ArrayCollection();
    }

    // ==============================
    // GETTERS / SETTERS
    // ==============================

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;
        return $this;
    }

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): static
    {
        $this->prenom = $prenom;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getMotDePasseHash(): ?string
    {
        return $this->motDePasseHash;
    }

    public function setMotDePasseHash(string $motDePasseHash): static
    {
        $this->motDePasseHash = $motDePasseHash;
        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function getDateCreation(): \DateTimeImmutable
    {
        return $this->dateCreation;
    }

    public function setDateCreation(\DateTimeImmutable $dateCreation): static
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }

    public function getSoldeCredits(): int
    {
        return $this->soldeCredits;
    }

    public function setSoldeCredits(int $soldeCredits): static
    {
        $this->soldeCredits = $soldeCredits;
        return $this;
    }

    /**
     * Permet de savoir si le compte est suspendu.
     */
    public function isSuspended(): bool
    {
        return $this->isSuspended;
    }

    /**
     * Permet à l'admin de suspendre ou réactiver un compte.
     */
    public function setIsSuspended(bool $isSuspended): static
    {
        $this->isSuspended = $isSuspended;
        return $this;
    }

    /**
     * @return Collection<int, Trajet>
     */
    public function getTrajets(): Collection
    {
        return $this->trajets;
    }

    public function addTrajet(Trajet $trajet): static
    {
        if (!$this->trajets->contains($trajet)) {
            $this->trajets->add($trajet);
            $trajet->setConducteur($this);
        }
        return $this;
    }

    public function removeTrajet(Trajet $trajet): static
    {
        if ($this->trajets->removeElement($trajet)) {
            if ($trajet->getConducteur() === $this) {
                $trajet->setConducteur(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Reservation>
     */
    public function getReservations(): Collection
    {
        return $this->reservations;
    }

    public function addReservation(Reservation $reservation): static
    {
        if (!$this->reservations->contains($reservation)) {
            $this->reservations->add($reservation);
            $reservation->setPassager($this);
        }
        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            if ($reservation->getPassager() === $this) {
                $reservation->setPassager(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Vehicule>
     */
    public function getVehicules(): Collection
    {
        return $this->vehicules;
    }

    public function addVehicule(Vehicule $vehicule): static
    {
        if (!$this->vehicules->contains($vehicule)) {
            $this->vehicules->add($vehicule);
            $vehicule->setProprietaire($this);
        }
        return $this;
    }

    public function removeVehicule(Vehicule $vehicule): static
    {
        if ($this->vehicules->removeElement($vehicule)) {
            if ($vehicule->getProprietaire() === $this) {
                $vehicule->setProprietaire(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, TransactionCredit>
     */
    public function getTransactionsCredits(): Collection
    {
        return $this->transactionsCredits;
    }

    public function addTransactionCredit(TransactionCredit $transactionCredit): static
    {
        if (!$this->transactionsCredits->contains($transactionCredit)) {
            $this->transactionsCredits->add($transactionCredit);
            $transactionCredit->setUtilisateur($this);
        }
        return $this;
    }

    public function removeTransactionCredit(TransactionCredit $transactionCredit): static
    {
        if ($this->transactionsCredits->removeElement($transactionCredit)) {
            if ($transactionCredit->getUtilisateur() === $this) {
                $transactionCredit->setUtilisateur(null);
            }
        }
        return $this;
    }

    // ==============================
    // SYMFONY SECURITY
    // ==============================

    /**
     * Identifiant utilisé par Symfony Security (ici : email).
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * Compatibilité éventuelle avec de vieux composants (optionnel).
     */
    public function getUsername(): string
    {
        return $this->getUserIdentifier();
    }

    /**
     * Rôles Symfony.
     * Je stocke un rôle principal en base (champ "role"),
     * puis j'ajoute toujours ROLE_USER.
     */
    public function getRoles(): array
    {
        $roles = [];

        if (!empty($this->role)) {
            $roles[] = $this->role;
        }

        // Toujours au moins ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_values(array_unique($roles));
    }

    /**
     * Pas de données sensibles temporaires à effacer (pour l'instant).
     */
    public function eraseCredentials(): void
    {
        // rien pour le moment
    }

    /**
     * Symfony récupère le mot de passe via cette méthode.
     */
    public function getPassword(): ?string
    {
        return $this->motDePasseHash;
    }

    public function getAvatar(): string
    {
    return $this->avatar;
    }

    public function setAvatar(string $avatar): static
    {
    $this->avatar = $avatar;
    return $this;
    }
}