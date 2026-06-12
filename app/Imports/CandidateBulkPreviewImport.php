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

        // PhpSpreadsheet kadang mengembalikan objek DateTime langsung
        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('Y-m-d');
        }

        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
        }

        $formats = ['d/m/Y', 'Y-m-d', 'd-m-Y', 'm/d/Y', 'd/m/Y H:i:s', 'Y-m-d H:i:s'];
        foreach ($formats as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->format('Y-m-d');
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }
}
