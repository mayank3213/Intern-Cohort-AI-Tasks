<?php

declare(strict_types=1);

use ContactApi\App;
use ContactApi\Config;
use ContactApi\ContactStore;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;

require dirname(__DIR__) . '/vendor/autoload.php';

$config = new Config(dirname(__DIR__) . '/config/app.php');
$logger = new Logger('contact-api');
$logger->pushHandler(new StreamHandler($config->logPath(), Logger::INFO));

$app = new App($config, new ContactStore(), $logger);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

$app->handle($method, $path);
