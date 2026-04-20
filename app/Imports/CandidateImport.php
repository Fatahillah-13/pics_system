<?php

namespace App\Imports;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

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
            'birthdate' => $row['birthdate'] ?? null,
            'first_working_day' => $row['first_working_day'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'job_level' => 'required|string|exists:joblevels,name',
            'department' => 'required|string|exists:departments,name',
            'nik' => 'nullable|string|max:255',
            'birthplace' => 'nullable|string|max:255',
            'birthdate' => 'nullable|date',
            'first_working_day' => 'nullable|date',
        ];
    }
}
