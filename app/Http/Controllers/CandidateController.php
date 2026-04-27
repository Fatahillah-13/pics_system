<?php

namespace App\Http\Controllers;

use App\Exports\CandidateTemplateExport;
use App\Imports\CandidateImport;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\Request;
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

        Candidate::create($validated);

        return redirect()->back();
    }

    public function edit(Candidate $candidate)
    {
        $candidate->load(['joblevel', 'department']);
        $departments = Department::all();
        $joblevels = Joblevel::all();

        return Inertia::render('NewCandidates/EditCandidate', [
            'candidate' => $candidate,
            'departments' => $departments,
            'joblevels' => $joblevels,
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
        ]);

        $candidate->update($validated);

        return redirect()->back();
    }

    public function destroy(Candidate $candidate)
    {
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

        return redirect()->back();
    }

    public function downloadTemplate()
    {
        return Excel::download(new CandidateTemplateExport, 'template_import_kandidat.xlsx');
    }
}
