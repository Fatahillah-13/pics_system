<?php

namespace App\Http\Controllers\SettingsController;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleManagementController extends Controller
{
    // Permissions grouped by feature for the frontend
    private function groupedPermissions(): array
    {
        return [
            'Kandidat' => [
                'view candidates',
                'create candidates',
                'edit candidates',
                'delete candidates',
                'import candidates',
                'bulk add candidates',
            ],
            'Foto & NIK' => [
                'upload image',
                'view upload nik',
                'upload nik',
            ],
            'ID Card' => [
                'view print id cards',
                'print id cards',
                'reprint id cards',
            ],
            'Settings' => [
                'manage users',
                'manage roles',
                'view logs',
                'manage id card templates',
            ],
        ];
    }

    public function view()
    {
        return Inertia::render('Settings/RoleManagement', [
            'roles' => Role::with('permissions', 'users')
                ->get()
                ->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name'),
                    'users_count' => $role->users->count(),
                ]),
            'allPermissions' => Permission::orderBy('name')->pluck('name'),
            'groupedPermissions' => $this->groupedPermissions(),
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);
        $role->syncPermissions($request->permissions ?? []);

        return back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->permissions ?? []);

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Role $role)
    {
        if ($role->users()->count() > 0) {
            return back()->with('error', 'Role masih digunakan oleh user. Pindahkan user terlebih dahulu.');
        }

        $role->delete();

        return back()->with('success', 'Role berhasil dihapus.');
    }
}
