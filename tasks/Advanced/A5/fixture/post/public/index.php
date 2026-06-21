<?php

declare(strict_types=1);

use ContactApi\App;
use ContactApi\Config;
use ContactApi\ContactRepository;
use ContactApi\ContactStore;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use PDO;

require dirname(__DIR__) . '/vendor/autoload.php';

$config = new Config(dirname(__DIR__) . '/config/app.php');
$logger = new Logger('contact-api');
$logger->pushHandler(new StreamHandler($config->logPath(), Logger::INFO));

$dbPath = $config->databasePath();
if (!is_dir(dirname($dbPath))) {
    mkdir(dirname($dbPath), 0777, true);
}
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->exec(file_get_contents(dirname(__DIR__) . '/schema.sql') ?: '');

$app = new App($config, new ContactStore(), new ContactRepository($pdo), $logger);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!empty($_SERVER['QUERY_STRING'])) {
    $path .= '?' . $_SERVER['QUERY_STRING'];
}

$app->handle($method, $path);
