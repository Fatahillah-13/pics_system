<?php

namespace App\Imports;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class CandidateImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        $joblevel = Joblevel::where('name', $row['job_level'])->first();
        $department = Department::where('name', $row['department'])->first();

        return new Candidate([
            'name' => $row['name'],
            'nik' => $row['nik'] ?? null,
            'joblevel_id' => $joblevel?->id,
            'department_id' => $department?->id,
            'birthplace' => $row['birthplace'] ?? null,
            'birthdate' => $this->parseDate($row['birthdate'] ?? null),
            'first_working_day' => $this->parseDate($row['first_working_day'] ?? null),
        ]);
    }

    private function parseDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // Nilai numerik = Excel serial date
        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
        }

        // Format string DD/MM/YYYY dari Excel
        try {
            return Carbon::createFromFormat('d/m/Y', $value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'job_level' => 'required|string|exists:joblevels,name',
            'department' => 'required|string|exists:departments,name',
            'nik' => 'nullable|string|max:255',
            'birthplace' => 'nullable|string|max:255',
            'birthdate' => 'nullable',
            'first_working_day' => 'nullable',
        ];
    }
}
