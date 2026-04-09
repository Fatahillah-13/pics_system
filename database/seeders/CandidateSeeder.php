<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Database\Seeder;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $departmentIds = Department::pluck('id')->toArray();
        $joblevelIds = Joblevel::pluck('id')->toArray();

        $candidates = [
            [
                'name' => 'Ahmad Fauzi',
                'birthplace' => 'Jakarta',
                'birthdate' => '1995-03-15',
                'first_working_day' => '2026-04-10',
            ],
            [
                'name' => 'Siti Nurhaliza',
                'birthplace' => 'Bandung',
                'birthdate' => '1998-07-22',
                'first_working_day' => '2026-04-10',
            ],
            [
                'name' => 'Budi Santoso',
                'birthplace' => 'Surabaya',
                'birthdate' => '1993-11-05',
                'first_working_day' => '2026-04-15',
            ],
            [
                'name' => 'Dewi Anggraini',
                'birthplace' => 'Semarang',
                'birthdate' => '1997-01-30',
                'first_working_day' => '2026-04-15',
            ],
            [
                'name' => 'Rizky Pratama',
                'birthplace' => 'Medan',
                'birthdate' => '1996-09-12',
                'first_working_day' => '2026-05-01',
            ],
        ];

        foreach ($candidates as $data) {
            $data['department_id'] = $departmentIds[array_rand($departmentIds)];
            $data['joblevel_id'] = $joblevelIds[array_rand($joblevelIds)];
            Candidate::create($data);
        }
    }
}
