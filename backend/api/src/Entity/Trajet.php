<?php

namespace App\Entity;

use App\Repository\TrajetRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TrajetRepository::class)]
class Trajet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $departVille = null;

    #[ORM\Column(length: 255)]
    private ?string $arriveeVille = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateDepart = null;

    #[ORM\Column]
    private ?int $prixParPlace = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private ?int $placesTotal = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private ?int $placesRestantes = null;

    #[ORM\Column(length: 30)]
    private ?string $statut = null;

    #[ORM\ManyToOne(inversedBy: 'trajets')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $conducteur = null;

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'trajet')]
    private Collection $reservations;

    public function __construct()
    {
        $this->reservations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDepartVille(): ?string
    {
        return $this->departVille;
    }

    public function setDepartVille(string $departVille): static
    {
        $this->departVille = $departVille;

        return $this;
    }

    public function getArriveeVille(): ?string
    {
        return $this->arriveeVille;
    }

    public function setArriveeVille(string $arriveeVille): static
    {
        $this->arriveeVille = $arriveeVille;

        return $this;
    }

    public function getDateDepart(): ?\DateTimeImmutable
    {
        return $this->dateDepart;
    }

    public function setDateDepart(\DateTimeImmutable $dateDepart): static
    {
        $this->dateDepart = $dateDepart;

        return $this;
    }

    public function getPrixParPlace(): ?int
    {
        return $this->prixParPlace;
    }

    public function setPrixParPlace(int $prixParPlace): static
    {
        $this->prixParPlace = $prixParPlace;

        return $this;
    }

    public function getPlacesTotal(): ?int
    {
        return $this->placesTotal;
    }

    public function setPlacesTotal(int $placesTotal): static
    {
        $this->placesTotal = $placesTotal;

        return $this;
    }

    public function getPlacesRestantes(): ?int
    {
        return $this->placesRestantes;
    }

    public function setPlacesRestantes(int $placesRestantes): static
    {
        $this->placesRestantes = $placesRestantes;

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

    public function getConducteur(): ?Utilisateur
    {
        return $this->conducteur;
    }

    public function setConducteur(?Utilisateur $conducteur): static
    {
        $this->conducteur = $conducteur;

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
            $reservation->setTrajet($this);
        }

        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            // set the owning side to null (unless already changed)
            if ($reservation->getTrajet() === $this) {
                $reservation->setTrajet(null);
            }
        }

        return $this;
    }
}
