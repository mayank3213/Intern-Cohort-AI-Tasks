#!/usr/bin/env php
<?php
declare(strict_types=1);

$fixtureRoot = dirname(__DIR__) . '/fixture/post';
require_once $fixtureRoot . '/src/ContactRepository.php';

$pdo = new PDO('sqlite::memory:');
$pdo->exec('CREATE TABLE contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)');
$pdo->exec("INSERT INTO contacts (name, email) VALUES ('Alice', 'alice@example.com')");
$pdo->exec("INSERT INTO contacts (name, email) VALUES ('Bob', 'bob@example.com')");
$pdo->exec("INSERT INTO contacts (name, email) VALUES ('Charlie', 'charlie@example.com')");

$repo = new ContactApi\ContactRepository($pdo);

echo "=== PRR-001 SQL injection reproduction ===\n\n";

$safe = $repo->search('Alice');
echo 'Safe term Alice -> ' . count($safe) . " row(s)\n";

$term = "x' OR '1'='1";
$injected = $repo->search($term);
echo 'Injection term -> ' . count($injected) . " row(s)\n";
echo json_encode($injected, JSON_PRETTY_PRINT) . "\n\n";

if (count($injected) >= 3) {
    echo "VERDICT: BLOCKING SQL injection confirmed\n";
    exit(1);
}

echo "VERDICT: injection not reproduced\n";
exit(0);
