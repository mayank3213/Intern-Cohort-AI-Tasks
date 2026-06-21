<?php

declare(strict_types=1);

namespace ContactApi;

final class Config
{
    /** @var array<string, mixed> */
    private array $settings;

    public function __construct(string $configPath)
    {
        $this->settings = require $configPath;
    }

    public function displayErrorDetails(): bool
    {
        return (bool) ($this->settings['display_error_details'] ?? false);
    }

    public function logPath(): string
    {
        return (string) ($this->settings['log_path']);
    }

    public function appName(): string
    {
        return (string) ($this->settings['app_name']);
    }

    public function databasePath(): string
    {
        return (string) ($this->settings['database_path']);
    }
}
