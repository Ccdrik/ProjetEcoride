<?php

namespace App\Service\Mongo;

use MongoDB\Client;
use MongoDB\Collection;

final class MongoProvider
{
    private Client $client;

    public function __construct(
        string $uri,
        private readonly string $dbName
    ) {
        $this->client = new Client($uri);
    }

    public function avisCollection(): Collection
    {
        return $this->client->selectCollection($this->dbName, 'avis');
    }
}