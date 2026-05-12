<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\UploadImageController;
use App\Http\Controllers\AddNIKCandidateController;
use App\Http\Controllers\PrintIdCardController;
use App\Http\Controllers\BulkAddCandidateController;
use App\Http\Controllers\ReprintIdCardController;
use App\Http\Controllers\SettingsController\UserManagementController;
use App\Http\Controllers\SettingsController\RoleManagementController;
use App\Http\Controllers\SettingsController\IdCardTemplateController;
use App\Http\Controllers\SettingsController\LogHistoryController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    $total = \App\Models\Candidate::count();
    $sudahCetak = \App\Models\Candidate::where('is_printed', true)->count();
    $belumCetak = $total - $sudahCetak;
    $belumFoto = \App\Models\Candidate::where(function ($q) {
        $q->whereNull('image_path')->orWhere('image_path', '');
    })->count();
    $belumNik = \App\Models\Candidate::where(function ($q) {
        $q->whereNull('nik')->orWhere('nik', '');
    })->count();

    $upcoming = \App\Models\Candidate::whereNotNull('first_working_day')
        ->where('first_working_day', '<=', now()->addDays(7)->toDateString())
        ->where('is_printed', false)
        ->orderBy('first_working_day')
        ->get(['id', 'name', 'first_working_day', 'is_printed'])
        ->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'first_working_day' => $c->first_working_day->toDateString(),
            'is_printed' => $c->is_printed,
        ]);

    return Inertia::render('Dashboard', [
        'stats' => [
            'total'      => $total,
            'sudahCetak' => $sudahCetak,
            'belumCetak' => $belumCetak,
            'belumFoto'  => $belumFoto,
            'belumNik'   => $belumNik,
            'sudahFoto'  => $total - $belumFoto,
            'sudahNik'   => $total - $belumNik,
        ],
        'upcoming' => $upcoming,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth', 'verified')->group(function () {

    // Candidate Routes
    Route::get('/candidates', [CandidateController::class, 'index'])->middleware('permission:view candidates')->name('candidates.index');
    Route::post('/candidates', [CandidateController::class, 'store'])->middleware('permission:create candidates')->name('candidates.store');
    Route::get('/candidates/{candidate}/edit', [CandidateController::class, 'edit'])->middleware('permission:edit candidates')->name('candidates.edit');
    Route::put('/candidates/{candidate}', [CandidateController::class, 'update'])->middleware('permission:edit candidates')->name('candidates.update');
    Route::delete('/candidates/{candidate}', [CandidateController::class, 'destroy'])->middleware('permission:delete candidates')->name('candidates.destroy');
    Route::post('/candidates/import', [CandidateController::class, 'import'])->middleware('permission:import candidates')->name('candidates.import');
    Route::get('/candidates/template', [CandidateController::class, 'downloadTemplate'])->name('candidates.template');

    // Upload Image Route
    Route::get('/candidates/upload-image', [UploadImageController::class, 'view'])->middleware('permission:upload image')->name('candidates.uploadImage.view');
    Route::post('/candidates/upload-image', [UploadImageController::class, 'store'])->middleware('permission:upload image')->name('candidates.uploadImage.store');
    Route::patch('/candidates/{candidate}/photo-number', [UploadImageController::class, 'updatePhotoNumber'])->middleware('permission:upload image')->name('candidates.updatePhotoNumber');

    // Add NIK Route
    Route::get('/candidates/upload-nik', [AddNIKCandidateController::class, 'view'])->middleware('permission:view upload nik')->name('candidates.uploadNik.view');
    Route::post('/candidates/upload-nik', [AddNIKCandidateController::class, 'store'])->middleware('permission:upload nik')->name('candidates.uploadNik.store');
    Route::post('/candidates/upload-nik/many', [AddNIKCandidateController::class, 'storeMany'])->middleware('permission:upload nik')->name('candidates.uploadNik.storeMany');

    // Print ID Card Route
    Route::get('/candidates/print-id-card', [PrintIdCardController::class, 'view'])->middleware('permission:view print id cards')->name('candidates.printIdCard.view');
    Route::post('/candidates/print-id-card', [PrintIdCardController::class, 'store'])->middleware('permission:print id cards')->name('candidates.printIdCard.store');

    // Bulk Add Candidate Route
    Route::get('/candidates/bulk-add', [BulkAddCandidateController::class, 'view'])->middleware('permission:bulk add candidates')->name('candidates.bulkAdd.view');
    Route::post('/candidates/bulk-add/preview', [BulkAddCandidateController::class, 'preview'])->middleware('permission:bulk add candidates')->name('candidates.bulkAdd.preview');
    Route::post('/candidates/bulk-add', [BulkAddCandidateController::class, 'store'])->middleware('permission:bulk add candidates')->name('candidates.bulkAdd.store');

    // Reprint ID Card Route
    Route::get('/re-print/search-employees', [ReprintIdCardController::class, 'searchEmployees'])->middleware('permission:reprint id cards')->name('candidates.reprintIdCard.search');
    Route::get('/re-print/lookup-employee', [ReprintIdCardController::class, 'lookupEmployee'])->middleware('permission:reprint id cards')->name('candidates.reprintIdCard.lookup');
    Route::post('/re-print/import-preview', [ReprintIdCardController::class, 'importPreview'])->middleware('permission:reprint id cards')->name('candidates.reprintIdCard.importPreview');
    Route::get('/re-print', [ReprintIdCardController::class, 'view'])->middleware('permission:reprint id cards')->name('candidates.reprintIdCard.view');
    Route::post('/re-print', [ReprintIdCardController::class, 'store'])->middleware('permission:reprint id cards')->name('candidates.reprintIdCard.store');
});

Route::middleware('auth')->group(function () {
    // User Management Routes
    Route::get('/settings/user-management', [UserManagementController::class, 'view'])->middleware('permission:manage users')->name('settings.userManagement.view');
    Route::post('/settings/user-management', [UserManagementController::class, 'store'])->middleware('permission:manage users')->name('settings.userManagement.store');
    Route::put('/settings/user-management/{user}', [UserManagementController::class, 'update'])->middleware('permission:manage users')->name('settings.userManagement.update');
    Route::delete('/settings/user-management/{user}', [UserManagementController::class, 'destroy'])->middleware('permission:manage users')->name('settings.userManagement.destroy');

    // Role Management Routes
    Route::get('/settings/role-management', [RoleManagementController::class, 'view'])->middleware('permission:manage roles')->name('settings.roleManagement.view');
    Route::post('/settings/role-management', [RoleManagementController::class, 'store'])->middleware('permission:manage roles')->name('settings.roleManagement.store');
    Route::put('/settings/role-management/{role}', [RoleManagementController::class, 'update'])->middleware('permission:manage roles')->name('settings.roleManagement.update');
    Route::delete('/settings/role-management/{role}', [RoleManagementController::class, 'destroy'])->middleware('permission:manage roles')->name('settings.roleManagement.destroy');

    // ID Card Template Routes
    Route::get('/settings/id-card-template', [IdCardTemplateController::class, 'view'])->middleware('permission:manage id card templates')->name('settings.idCardTemplate.view');
    Route::post('/settings/id-card-template', [IdCardTemplateController::class, 'store'])->middleware('permission:manage id card templates')->name('settings.idCardTemplate.store');
    Route::post('/settings/id-card-template/{cardTemplate}', [IdCardTemplateController::class, 'update'])->middleware('permission:manage id card templates')->name('settings.idCardTemplate.update');
    Route::delete('/settings/id-card-template/{cardTemplate}', [IdCardTemplateController::class, 'destroy'])->middleware('permission:manage id card templates')->name('settings.idCardTemplate.destroy');

    // Log History Route
    Route::get('/settings/log-history', [LogHistoryController::class, 'view'])->middleware('permission:view logs')->name('settings.logHistory.view');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
