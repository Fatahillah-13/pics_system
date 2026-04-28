<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ReprintPreviewImport implements ToArray, WithHeadingRow
{
    public function array(array $rows): array
    {
        return array_values(
            array_filter(
                array_map(function ($row) {
                    // WithHeadingRow normalises headings to lowercase snake_case
                    // Accept both "nik"/"NIK" and "nama"/"name"/"Nama"
                    $nik  = $this->normalizeCell($row['nik']  ?? null);
                    $name = $this->normalizeCell($row['nama'] ?? $row['name'] ?? null);

                    return ['nik' => $nik, 'name' => $name];
                }, $rows),
                // Drop rows where both nik and name are empty
                fn($r) => $r['nik'] !== '' || $r['name'] !== ''
            )
        );
    }

    /**
     * Normalise a cell value from Excel.
     * Excel reads empty numeric cells as 0 (integer), and may return
     * floats for NIK numbers (e.g. 12345.0). This converts all of these
     * to a clean trimmed string.
     */
    private function normalizeCell(mixed $value): string
    {
        if ($value === null || $value === false) {
            return '';
        }

        if (is_int($value) || is_float($value)) {
            if ($value == 0) return '';         // empty numeric cell in Excel
            return (string) (int) $value;       // 12345.0 → "12345"
        }

        return trim((string) $value);
    }
}
