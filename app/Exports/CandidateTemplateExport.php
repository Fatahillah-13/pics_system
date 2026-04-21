<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CandidateTemplateExport implements FromArray, WithHeadings, WithStyles
{
    public function headings(): array
    {
        return [
            'name',
            'photo_number',
            'job_level',
            'department',
            'birthplace',
            'birthdate',
            'first_working_day',
        ];
    }

    public function array(): array
    {
        return [
            ['John Doe', '1', 'Staff', 'IT', 'Jakarta', '1995-01-15', '2026-04-20'],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
