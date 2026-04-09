<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            'Human Resource',
            'Finance',
            'Marketing',
            'IT',
            'Operations',
            'Sales',
            'Legal',
            'Procurement',
        ];

        foreach ($departments as $name) {
            Department::create(['name' => $name]);
        }
    }
}
