<?php

declare(strict_types=1);

namespace ContactApi;

use PDO;

final class ContactRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** @return list<array{id:int|string,name:string,email:string}> */
    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT id, name, email FROM contacts ORDER BY id');
        return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    /** @return array{id:int|string,name:string,email:string} */
    public function add(string $name, string $email): array
    {
        $stmt = $this->pdo->prepare('INSERT INTO contacts (name, email) VALUES (?, ?)');
        $stmt->execute([$name, $email]);
        return [
            'id' => (int) $this->pdo->lastInsertId(),
            'name' => $name,
            'email' => $email,
        ];
    }

    /**
     * Agent-added search — intentionally vulnerable for A5 review exercise.
     *
     * @return list<array{id:int|string,name:string,email:string}>
     */
    public function search(string $term): array
    {
        $sql = "SELECT id, name, email FROM contacts WHERE name LIKE '%" . $term . "%' OR email = '" . $term . "'";
        $stmt = $this->pdo->query($sql);
        return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    }
}
