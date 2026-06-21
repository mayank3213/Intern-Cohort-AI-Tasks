<?php

declare(strict_types=1);

namespace ContactApi;

use Monolog\Handler\StreamHandler;
use Monolog\Logger;

final class App
{
    private Config $config;
    private ContactStore $store;
    private Logger $logger;

    public function __construct(Config $config, ContactStore $store, Logger $logger)
    {
        $this->config = $config;
        $this->store = $store;
        $this->logger = $logger;
    }

    public function handle(string $method, string $path): void
    {
        if ($this->config->displayErrorDetails()) {
            ini_set('display_errors', '1');
        }

        try {
            if ($method === 'GET' && $path === '/health') {
                $this->json(200, ['status' => 'ok', 'app' => $this->config->appName()]);
                return;
            }

            if ($method === 'GET' && $path === '/contacts') {
                $this->json(200, ['contacts' => $this->store->all()]);
                return;
            }

            if ($method === 'POST' && $path === '/contacts') {
                $body = json_decode(file_get_contents('php://input') ?: '{}', true);
                if (!is_array($body) || empty($body['name']) || empty($body['email'])) {
                    $this->json(422, ['error' => 'name and email required']);
                    return;
                }
                $contact = $this->store->add((string) $body['name'], (string) $body['email']);
                $this->logger->info('contact_created', ['id' => $contact['id']]);
                $this->json(201, ['contact' => $contact]);
                return;
            }

            $this->json(404, ['error' => 'not found']);
        } catch (\Throwable $e) {
            $this->logger->error('request_failed', ['message' => $e->getMessage()]);
            $payload = ['error' => 'internal error'];
            if ($this->config->displayErrorDetails()) {
                $payload['detail'] = $e->getMessage();
            }
            $this->json(500, $payload);
        }
    }

    /** @param array<string, mixed> $payload */
    private function json(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($payload);
    }
}
