<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;


#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface

{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 80)]
    private ?string $nom = null;

    #[ORM\Column(length: 80)]
    private ?string $prenom = null;

    #[ORM\Column(length: 180, unique: true)]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    private ?string $motDePasseHash = null;

    #[ORM\Column(length: 20)]
    private ?string $role = null;

    #[ORM\Column]
    private \DateTimeImmutable $dateCreation;

    #[ORM\Column]
    private int $soldeCredits = 0;

    /**
     * @var Collection<int, Trajet>
     */
    #[ORM\OneToMany(targetEntity: Trajet::class, mappedBy: 'conducteur')]
    private Collection $trajets;

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'passager')]
    private Collection $reservations;

    /**
     * @var Collection<int, Vehicule>
     */
    #[ORM\OneToMany(targetEntity: Vehicule::class, mappedBy: 'proprietaire')]
    private Collection $vehicules;

    /**
     * @var Collection<int, TransactionCredit>
     */
    #[ORM\OneToMany(targetEntity: TransactionCredit::class, mappedBy: 'utilisateur')]
    private Collection $transactionsCredits;

    public function __construct()
    {
        $this->dateCreation = new \DateTimeImmutable();
        $this->trajets = new ArrayCollection();
        $this->reservations = new ArrayCollection();
        $this->vehicules = new ArrayCollection();
        $this->transactionsCredits = new ArrayCollection();
    }

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

    // Symfony Security

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    // (optionnel mais utile pour compat ancienne)
    public function getUsername(): string
    {
        return $this->getUserIdentifier();
    }

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

    public function eraseCredentials(): void
    {
        // rien pour le moment
    }

    public function getPassword(): ?string
    {
        return $this->motDePasseHash;
    }
}

