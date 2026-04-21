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

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth', 'verified')->group(function () {

    // Candidate Routes
    Route::get('/candidates', [CandidateController::class, 'index'])->name('candidates.index');
    Route::post('/candidates', [CandidateController::class, 'store'])->name('candidates.store');
    Route::put('/candidates/{candidate}', [CandidateController::class, 'update'])->name('candidates.update');
    Route::delete('/candidates/{candidate}', [CandidateController::class, 'destroy'])->name('candidates.destroy');
    Route::post('/candidates/import', [CandidateController::class, 'import'])->name('candidates.import');
    Route::get('/candidates/template', [CandidateController::class, 'downloadTemplate'])->name('candidates.template');

    // Upload Image Route
    Route::get('/candidates/upload-image', [UploadImageController::class, 'view'])->name('candidates.uploadImage.view');
    Route::post('/candidates/upload-image', [UploadImageController::class, 'store'])->name('candidates.uploadImage.store');
    Route::patch('/candidates/{candidate}/photo-number', [UploadImageController::class, 'updatePhotoNumber'])->name('candidates.updatePhotoNumber');

    // Add NIK Route
    Route::get('/candidates/upload-nik', [AddNIKCandidateController::class, 'view'])->name('candidates.uploadNik.view');
    Route::post('/candidates/upload-nik', [AddNIKCandidateController::class, 'store'])->name('candidates.uploadNik.store');

    // Print ID Card Route
    Route::get('/candidates/print-id-card', [PrintIdCardController::class, 'view'])->name('candidates.printIdCard.view');
    Route::post('/candidates/print-id-card', [PrintIdCardController::class, 'store'])->name('candidates.printIdCard.store');

    // Bulk Add Candidate Route
    Route::get('/candidates/bulk-add', [BulkAddCandidateController::class, 'view'])->name('candidates.bulkAdd.view');
    Route::post('/candidates/bulk-add', [BulkAddCandidateController::class, 'store'])->name('candidates.bulkAdd.store');

    // Reprint ID Card Route
    Route::get('/re-print', [ReprintIdCardController::class, 'view'])->name('candidates.reprintIdCard.view');
    Route::post('/re-print', [ReprintIdCardController::class, 'store'])->name('candidates.reprintIdCard.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
