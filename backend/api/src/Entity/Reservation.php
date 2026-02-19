<?php

namespace App\Entity;

use App\Repository\ReservationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReservationRepository::class)]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private ?int $nbPlaces = null;

    #[ORM\Column(length: 30)]
    private ?string $statut = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateCreation = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Trajet $trajet = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $passager = null;

    /**
     * @var Collection<int, TransactionCredit>
     */
    #[ORM\OneToMany(targetEntity: TransactionCredit::class, mappedBy: 'reservation')]
    private Collection $transactionsCredits;

    public function __construct()
    {
        $this->transactionsCredits = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNbPlaces(): ?int
    {
        return $this->nbPlaces;
    }

    public function setNbPlaces(int $nbPlaces): static
    {
        $this->nbPlaces = $nbPlaces;

        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getDateCreation(): ?\DateTimeImmutable
    {
        return $this->dateCreation;
    }

    public function setDateCreation(\DateTimeImmutable $dateCreation): static
    {
        $this->dateCreation = $dateCreation;

        return $this;
    }

    public function getTrajet(): ?Trajet
    {
        return $this->trajet;
    }

    public function setTrajet(?Trajet $trajet): static
    {
        $this->trajet = $trajet;

        return $this;
    }

    public function getPassager(): ?Utilisateur
    {
        return $this->passager;
    }

    public function setPassager(?Utilisateur $passager): static
    {
        $this->passager = $passager;

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
            $transactionCredit->setReservation($this);
        }

        return $this;
    }

   public function removeTransactionCredit(TransactionCredit $transactionCredit): static
    {
         if ($this->transactionsCredits->removeElement($transactionCredit)) {
             if ($transactionCredit->getReservation() === $this) {
            $transactionCredit->setReservation(null);
        }
    }

    return $this;
}
}
