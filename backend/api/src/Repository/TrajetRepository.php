<?php

namespace App\Repository;

use App\Entity\Trajet;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Trajet>
 */
class TrajetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Trajet::class);
    }

    public function search(array $filters): array
    {
        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.vehicule', 'v')
            ->orderBy('t.dateDepart', 'ASC');

        // On limite aux trajets visibles publiquement
        $qb->andWhere('t.statut IN (:statuts)')
            ->setParameter('statuts', ['PLANIFIE', 'OUVERT']);

        if (!empty($filters['depart'])) {
            $qb->andWhere('LOWER(t.departVille) LIKE LOWER(:depart)')
                ->setParameter('depart', trim($filters['depart']) . '%');
        }

        if (!empty($filters['arrivee'])) {
            $qb->andWhere('LOWER(t.arriveeVille) LIKE LOWER(:arrivee)')
                ->setParameter('arrivee', trim($filters['arrivee']) . '%');
        }

        if (!empty($filters['date'])) {
            try {
                $debutJour = new \DateTimeImmutable($filters['date'] . ' 00:00:00');
                $finJour = new \DateTimeImmutable($filters['date'] . ' 23:59:59');

                $qb->andWhere('t.dateDepart BETWEEN :debutJour AND :finJour')
                    ->setParameter('debutJour', $debutJour)
                    ->setParameter('finJour', $finJour);
            } catch (\Exception $e) {
                // Si la date est invalide, on n'applique pas le filtre
            }
        }

        if (!empty($filters['prixMax'])) {
            $qb->andWhere('t.prixParPlace <= :prixMax')
                ->setParameter('prixMax', (int) $filters['prixMax']);
        }

        if (!empty($filters['eco']) && (string) $filters['eco'] === '1') {
            $qb->andWhere('LOWER(v.energie) IN (:energies)')
                ->setParameter('energies', ['electrique', 'électrique', 'hybride']);
        }

        return $qb->getQuery()->getResult();
    }
}