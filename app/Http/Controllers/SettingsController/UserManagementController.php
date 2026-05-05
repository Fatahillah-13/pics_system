<?php

namespace App\Http\Controllers\SettingsController;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function view()
    {
        return Inertia::render('Settings/UserManagement', [
            'users' => User::with('roles')
                ->get()
                ->map(fn($user) => [
                    'id'        => $user->id,
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'is_active' => $user->is_active,
                    'role'      => $user->roles->first()?->name,
                ]),
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $user->assignRole($request->role);

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = [
            'name'      => $request->name,
            'email'     => $request->email,
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        $user->syncRoles([$request->role]);

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        // Prevent deleting self
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }
}
