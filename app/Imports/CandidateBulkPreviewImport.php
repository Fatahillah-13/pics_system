<?php

namespace App\Imports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class CandidateBulkPreviewImport implements ToArray, WithHeadingRow
{
    public function array(array $array): array
    {
        return array_map(function ($row) {
            $row['birthdate'] = $this->parseDate($row['birthdate'] ?? null);
            $row['first_working_day'] = $this->parseDate($row['first_working_day'] ?? null);
            return $row;
        }, $array);
    }

    private function parseDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
        }

        try {
            return Carbon::createFromFormat('d/m/Y', $value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}
