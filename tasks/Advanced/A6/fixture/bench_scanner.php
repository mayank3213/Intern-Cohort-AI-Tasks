<?php

declare(strict_types=1);

require __DIR__ . '/FileScanner.php';

$options = getopt('', ['fixture:', 'iterations:', 'profile']);
$fixture = $options['fixture'] ?? (__DIR__ . '/fixtures/scanner_tree');
$iterations = isset($options['iterations']) ? (int) $options['iterations'] : 5;

if (!is_dir($fixture)) {
    fwrite(STDERR, "Fixture missing: $fixture — run generate_fixture.php first\n");
    exit(1);
}

$wallMs = [];

for ($i = 0; $i < $iterations; $i++) {
    $start = hrtime(true);
    $files = FileScanner::fileSearch($fixture, '.php');
    $elapsedNs = hrtime(true) - $start;
    $ms = $elapsedNs / 1_000_000;
    $wallMs[] = $ms;
    if (isset($options['profile'])) {
        fprintf(STDERR, "iteration %d: %.3f ms (%d files)\n", $i + 1, $ms, count($files));
    }
}

sort($wallMs);
$mid = (int) floor(count($wallMs) / 2);
$median = count($wallMs) % 2 === 0
    ? ($wallMs[$mid - 1] + $wallMs[$mid]) / 2
    : $wallMs[$mid];

$fileCount = count(FileScanner::fileSearch($fixture, '.php'));
$throughput = $fileCount > 0 ? ($fileCount / ($median / 1000)) : 0;

$result = [
    'files_found' => $fileCount,
    'iterations' => $iterations,
    'median_wall_ms' => round($median, 3),
    'median_throughput_files_per_sec' => round($throughput, 1),
    'wall_ms_spread' => [round(min($wallMs), 3), round(max($wallMs), 3)],
    'output_hash' => hash('sha256', implode("\n", $files)),
];

echo json_encode($result, JSON_PRETTY_PRINT) . "\n";
