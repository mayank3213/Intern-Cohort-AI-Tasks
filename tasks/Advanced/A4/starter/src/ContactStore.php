<?php

declare(strict_types=1);

namespace ContactApi;

final class ContactStore
{
    /** @var list<array{id:int,name:string,email:string}> */
    private array $contacts = [
        ['id' => 1, 'name' => 'Ada Lovelace', 'email' => 'ada@example.com'],
    ];

    private int $nextId = 2;

    /** @return list<array{id:int,name:string,email:string}> */
    public function all(): array
    {
        return $this->contacts;
    }

    /** @return array{id:int,name:string,email:string} */
    public function add(string $name, string $email): array
    {
        $contact = [
            'id' => $this->nextId++,
            'name' => $name,
            'email' => $email,
        ];
        $this->contacts[] = $contact;
        return $contact;
    }
}
