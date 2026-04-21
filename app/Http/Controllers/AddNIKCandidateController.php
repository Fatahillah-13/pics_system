<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AddNIKCandidateController extends Controller
{
    public function view()
    {
        return Inertia::render('NewCandidates/AddNik', [
            'candidates' => Candidate::with(['joblevel', 'department'])
                ->whereNull('nik')
                ->whereNotNull('image_path')
                ->orWhere('nik', '')
                ->latest()
                ->get(),
            'departments' => Department::all(),
            'joblevels' => Joblevel::all(),
        ]);
    }

    public function store(Request $request)
    {
        // Logic to handle the submission of NIK for candidates
    }
}
