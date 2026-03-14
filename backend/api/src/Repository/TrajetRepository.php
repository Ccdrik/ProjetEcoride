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

    public function search(array $filters)
{
    $qb = $this->createQueryBuilder('t')
        ->where('t.statut = :statut')
        ->setParameter('statut', 'PLANIFIE');

    if (!empty($filters['depart'])) {
        $qb->andWhere('LOWER(t.departVille) LIKE LOWER(:depart)')
           ->setParameter('depart', $filters['depart'].'%');
    }

    if (!empty($filters['arrivee'])) {
        $qb->andWhere('LOWER(t.arriveeVille) LIKE LOWER(:arrivee)')
           ->setParameter('arrivee', $filters['arrivee'].'%');
    }

    if (!empty($filters['date'])) {
        $qb->andWhere('DATE(t.dateDepart) = :date')
           ->setParameter('date', $filters['date']);
    }

    if (!empty($filters['prixMax'])) {
        $qb->andWhere('t.prixParPlace <= :prixMax')
           ->setParameter('prixMax', $filters['prixMax']);
    }

    return $qb
        ->orderBy('t.dateDepart', 'ASC')
        ->getQuery()
        ->getResult();
}

    //    /**
    //     * @return Trajet[] Returns an array of Trajet objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('t.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Trajet
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
