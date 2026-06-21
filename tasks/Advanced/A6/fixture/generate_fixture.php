<?php

declare(strict_types=1);

/**
 * Generate a synthetic directory tree for FileScanner benchmarks.
 *
 * Usage:
 *   php generate_fixture.php <target_dir> [depth] [breadth] [files_per_dir]
 *
 * Default matches A6 golden workload: depth=5, breadth=4, files_per_dir=10 (~13,650 files).
 */

if ($argc < 2) {
    fwrite(STDERR, "Usage: php generate_fixture.php <target_dir> [depth] [breadth] [files_per_dir]\n");
    exit(1);
}

$target = $argv[1];
$depth = isset($argv[2]) ? (int) $argv[2] : 5;
$breadth = isset($argv[3]) ? (int) $argv[3] : 4;
$filesPerDir = isset($argv[4]) ? (int) $argv[4] : 10;

if (is_dir($target)) {
    fwrite(STDERR, "Target already exists: $target\n");
    exit(1);
}

mkdir($target, 0777, true);
generateLevel($target, $depth, $breadth, $filesPerDir, 0);

echo "Generated fixture at $target (depth=$depth breadth=$breadth files_per_dir=$filesPerDir)\n";

function generateLevel(string $dir, int $maxDepth, int $breadth, int $filesPerDir, int $currentDepth): void
{
    for ($f = 0; $f < $filesPerDir; $f++) {
        $name = sprintf('file_%03d.php', $f);
        file_put_contents($dir . DIRECTORY_SEPARATOR . $name, "<?php // fixture\n");
    }

    if ($currentDepth >= $maxDepth) {
        return;
    }

    for ($d = 0; $d < $breadth; $d++) {
        $sub = $dir . DIRECTORY_SEPARATOR . 'dir_' . $currentDepth . '_' . $d;
        mkdir($sub, 0777, true);
        generateLevel($sub, $maxDepth, $breadth, $filesPerDir, $currentDepth + 1);
    }
}
