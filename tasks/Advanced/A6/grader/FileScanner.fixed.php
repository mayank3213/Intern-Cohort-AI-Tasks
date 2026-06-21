<?php

declare(strict_types=1);

/**
 * Grader reference — fixed FileScanner (append instead of array_merge).
 * Candidates implement this fix themselves; do not copy during the exercise.
 */
final class FileScannerFixed
{
    /**
     * @return list<string>
     */
    public static function fileSearch(string $directory, string $extension = '.php'): array
    {
        $files = [];
        if (!is_dir($directory)) {
            return $files;
        }

        $handle = opendir($directory);
        if ($handle === false) {
            return $files;
        }

        while (($entry = readdir($handle)) !== false) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $path = $directory . DIRECTORY_SEPARATOR . $entry;

            if (is_dir($path)) {
                foreach (self::fileSearch($path, $extension) as $childFile) {
                    $files[] = $childFile;
                }
            } elseif (self::matchesExtension($entry, $extension)) {
                $files[] = $path;
            }
        }

        closedir($handle);
        return $files;
    }

    private static function matchesExtension(string $filename, string $extension): bool
    {
        return str_ends_with($filename, $extension);
    }
}
