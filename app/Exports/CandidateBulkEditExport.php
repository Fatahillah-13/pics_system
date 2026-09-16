<?php

namespace App\Exports;

use App\Models\Candidate;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CandidateBulkEditExport extends DefaultValueBinder implements FromCollection, WithCustomValueBinder, WithHeadings, WithStyles
{
    public function headings(): array
    {
        return ['nik', 'name', 'job_level', 'department'];
    }

    public function collection()
    {
        // Only candidates ready to print (has NIK and photo) can be bulk-edited
        return Candidate::with(['joblevel', 'department'])
            ->whereNotNull('nik')
            ->where('nik', '!=', '')
            ->whereNotNull('image_path')
            ->where('image_path', '!=', '')
            ->orderBy('name')
            ->get()
            ->map(fn (Candidate $c) => [
                'nik' => $c->nik,
                'name' => $c->name,
                'job_level' => $c->joblevel?->name,
                'department' => $c->department?->name,
            ]);
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function bindValue(Cell $cell, $value): bool
    {
        if ($cell->getColumn() === 'A' && $cell->getRow() > 1) {
            $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }
}
