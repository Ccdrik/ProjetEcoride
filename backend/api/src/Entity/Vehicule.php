<?php

    namespace App\Entity;

    use App\Repository\VehiculeRepository;
    use Doctrine\ORM\Mapping as ORM;

    #[ORM\Entity(repositoryClass: VehiculeRepository::class)]
    class Vehicule
    {
        #[ORM\Id]
        #[ORM\GeneratedValue]
        #[ORM\Column]
        private ?int $id = null;

        #[ORM\Column(length: 100)]
        private ?string $marque = null;

        #[ORM\Column(length: 100)]
        private ?string $modele = null;

        #[ORM\Column(length: 30)]
        private ?string $energie = null;

        #[ORM\Column(length: 50, nullable: true)]
        private ?string $couleur = null;

        #[ORM\Column(length: 30, nullable: true)]
        private ?string $immatriculation = null;

        #[ORM\Column(nullable: true)]
        private ?int $nbPlaces = null;

        #[ORM\ManyToOne(inversedBy: 'vehicules')]
        #[ORM\JoinColumn(nullable: false)]
        private ?Utilisateur $proprietaire = null;

        public function getId(): ?int
        {
            return $this->id;
        }

        public function getMarque(): ?string
        {
            return $this->marque;
        }

        public function setMarque(string $marque): static
        {
            $this->marque = $marque;

            return $this;
        }

        public function getModele(): ?string
        {
            return $this->modele;
        }

        public function setModele(string $modele): static
        {
            $this->modele = $modele;

            return $this;
        }

        public function getEnergie(): ?string
        {
            return $this->energie;
        }

        public function setEnergie(string $energie): static
        {
            $this->energie = $energie;

            return $this;
        }

        public function getCouleur(): ?string
        {
            return $this->couleur;
        }

        public function setCouleur(?string $couleur): static
        {   
            $this->couleur = $couleur;
            return $this;
        }

        public function getImmatriculation(): ?string
        {
            return $this->immatriculation;
        }

        public function setImmatriculation(?string $immatriculation): static
        {
            $this->immatriculation = $immatriculation;
            return $this;
        }

        public function getNbPlaces(): ?int
        {
            return $this->nbPlaces;
        }

        public function setNbPlaces(?int $nbPlaces): static
        {
            $this->nbPlaces = $nbPlaces;
            return $this;
        }

        public function getProprietaire(): ?Utilisateur
        {
            return $this->proprietaire;
        }

        public function setProprietaire(?Utilisateur $proprietaire): static
        {
            $this->proprietaire = $proprietaire;

            return $this;
        }
    }
