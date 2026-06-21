<?php

declare(strict_types=1);

namespace ContactApi;

use Monolog\Handler\StreamHandler;
use Monolog\Logger;

final class App
{
    private Config $config;
    private ContactStore $store;
    private ContactRepository $repository;
    private Logger $logger;

    public function __construct(
        Config $config,
        ContactStore $store,
        ContactRepository $repository,
        Logger $logger
    ) {
        $this->config = $config;
        $this->store = $store;
        $this->repository = $repository;
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
                $this->json(200, ['contacts' => $this->repository->all()]);
                return;
            }

            if ($method === 'GET' && str_starts_with($path, '/contacts/search')) {
                parse_str(parse_url($path, PHP_URL_QUERY) ?: '', $query);
                $term = (string) ($query['q'] ?? $_GET['q'] ?? '');
                $results = $this->repository->search($term);
                $this->json(200, ['results' => $results, 'query' => $term]);
                return;
            }

            if ($method === 'POST' && $path === '/contacts') {
                $body = json_decode(file_get_contents('php://input') ?: '{}', true);
                if (!is_array($body) || !isset($body['name'], $body['email'])) {
                    $this->json(400, ['error' => 'missing fields']);
                    return;
                }
                $name = (string) $body['name'];
                $email = (string) $body['email'];
                $contact = $this->repository->add($name, $email);
                $this->logger->info('contact_created', [
                    'id' => $contact['id'],
                    'email' => $email,
                    'payload' => $body,
                ]);
                $this->json(200, ['contact' => $contact]);
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
