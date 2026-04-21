<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\UploadImageController;

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
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
