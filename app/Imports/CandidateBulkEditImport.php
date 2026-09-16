<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CandidateBulkEditImport implements ToArray, WithHeadingRow
{
    public function array(array $array): array
    {
        // Drop phantom/empty rows that have no NIK
        return array_values(array_filter($array, fn ($row) => trim($row['nik'] ?? '') !== ''));
    }
}
