<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define permissions grouped by feature
        $permissions = [
            // Candidates
            'view candidates',
            'create candidates',
            'edit candidates',
            'delete candidates',
            'import candidates',
            // Image & NIK
            'upload image',
            'upload nik',
            // ID Card
            'print id cards',
            'reprint id cards',
            'bulk add candidates',
            // Settings
            'manage users',
            'manage roles',
            'view logs',
            'manage id card templates',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Define roles and their permissions
        $roles = [
            'Admin' => $permissions,
            'Recruiter' => [
                'view candidates',
                'create candidates',
                'edit candidates',
                'delete candidates',
                'import candidates',
                'upload image',
                'upload nik',
                'bulk add candidates',
                'print id cards',
            ],
            'Payroll' => [
                'view candidates',
                'reprint id cards',
            ],
            'Viewer' => [
                'view candidates',
            ],
        ];

        // Create roles and assign permissions
        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePermissions);
        }
    }
}
