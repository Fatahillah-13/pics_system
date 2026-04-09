<?php

namespace Database\Seeders;

use App\Models\Joblevel;
use Illuminate\Database\Seeder;

class JoblevelSeeder extends Seeder
{
    public function run(): void
    {
        $joblevels = [
            'Staff',
            'Senior Staff',
            'Supervisor',
            'Assistant Manager',
            'Manager',
            'Senior Manager',
            'Director',
        ];

        foreach ($joblevels as $name) {
            Joblevel::create(['name' => $name]);
        }
    }
}
