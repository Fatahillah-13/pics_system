<?php

namespace App\Http\Controllers;

use App\Exports\CandidateTemplateExport;
use App\Imports\CandidateImport;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class CandidateController extends Controller
{
    public function index()
    {
        $candidates = Candidate::with(['joblevel', 'department'])
            ->whereNull('image_path')
            ->orWhere('image_path', '')
            ->latest()
            ->get();
        $departments = Department::all();
        $joblevels = Joblevel::all();

        return Inertia::render('NewCandidates/AddCandidate', [
            'candidates' => $candidates,
            'departments' => $departments,
            'joblevels' => $joblevels,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'nullable|string|max:255',
            'photo_number' => 'nullable|integer',
            'joblevel_id' => 'required|exists:joblevels,id',
            'department_id' => 'required|exists:departments,id',
            'birthplace' => 'nullable|string|max:255',
            'birthdate' => 'nullable|date',
            'first_working_day' => 'nullable|date',
        ]);

        $candidate = Candidate::create($validated);

        ActivityLog::create([
            'candidate_id' => $candidate->id,
            'nik'          => $candidate->nik,
            'user_id'      => auth()->id(),
            'action'       => 'create',
            'notes'        => "Kandidat {$candidate->name} ditambahkan",
        ]);

        return redirect()->back();
    }

    public function edit(Candidate $candidate)
    {
        $candidate->load(['joblevel', 'department']);
        $departments = Department::all();
        $joblevels = Joblevel::all();

        $previousUrl = request()->get('from');
        // Only allow relative URLs to prevent open redirect
        if ($previousUrl && !str_starts_with($previousUrl, '/')) {
            $previousUrl = null;
        }

        return Inertia::render('NewCandidates/EditCandidate', [
            'candidate' => $candidate,
            'departments' => $departments,
            'joblevels' => $joblevels,
            'previousUrl' => $previousUrl,
        ]);
    }

    public function update(Request $request, Candidate $candidate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'nullable|string|max:255',
            'photo_number' => 'nullable|integer',
            'joblevel_id' => 'required|exists:joblevels,id',
            'department_id' => 'required|exists:departments,id',
            'birthplace' => 'nullable|string|max:255',
            'birthdate' => 'nullable|date',
            'first_working_day' => 'nullable|date',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            if ($candidate->image_path && Storage::disk('public')->exists($candidate->image_path)) {
                Storage::disk('public')->delete($candidate->image_path);
            }
            $ext = str_replace('jpeg', 'jpg', strtolower($request->file('photo')->getClientOriginalExtension()));
            $filename = 'candidates/' . $candidate->id . '_' . time() . '.' . $ext;
            Storage::disk('public')->put($filename, file_get_contents($request->file('photo')->getRealPath()));
            $validated['image_path'] = $filename;

            // Sync photo to new_employees_photo folder if candidate already has a NIK
            $nik = $validated['nik'] ?? $candidate->nik;
            if ($nik) {
                $destinationDir = storage_path('new_employees_photo');
                if (! is_dir($destinationDir)) {
                    mkdir($destinationDir, 0755, true);
                }
                $sourcePath = Storage::disk('public')->path($filename);
                $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . $nik . '.jpg';
                @copy($sourcePath, $destinationPath);
            }
        }

        unset($validated['photo']);
        $candidate->update($validated);

        ActivityLog::create([
            'action'       => 'update',
            'candidate_id' => $candidate->id,
            'nik'          => $candidate->nik,
            'user_id'      => auth()->id(),
            'notes'        => "Kandidat {$candidate->name} diperbarui",
        ]);

        return redirect()->back();
    }

    public function destroy(Candidate $candidate)
    {
        // Simpan info sebelum dihapus agar FK tidak gagal
        $name = $candidate->name;
        $nik  = $candidate->nik;

        ActivityLog::create([
            'action'       => 'delete',
            'candidate_id' => null,
            'nik'          => $nik,
            'user_id'      => auth()->id(),
            'notes'        => "Kandidat {$name} (NIK: {$nik}) dihapus",
        ]);

        $candidate->delete();

        return redirect()->back();
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            Excel::import(new CandidateImport, $request->file('file'));
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            return redirect()->back()->withErrors([
                'file' => 'Data tidak valid: ' . collect($e->failures())->map(fn($f) => "Baris {$f->row()}: {$f->errors()[0]}")->join(', '),
            ]);
        }

        ActivityLog::create([
            'action' => 'import',
            'user_id' => auth()->id(),
            'notes' => "Kandidat diimpor dari file {$request->file('file')->getClientOriginalName()}",
        ]);

        return redirect()->back();
    }

    public function downloadTemplate()
    {
        return Excel::download(new CandidateTemplateExport, 'template_import_kandidat.xlsx');
    }
}
