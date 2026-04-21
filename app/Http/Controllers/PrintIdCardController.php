<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrintIdCardController extends Controller
{
    public function view()
    {
        return Inertia::render('NewCandidates/PrintIdCard', [
            'candidates' => Candidate::with(['joblevel', 'department'])
                ->whereNotNull('nik')
                ->whereNotNull('image_path')
                ->latest()
                ->get(),
            'departments' => Department::all(),
            'joblevels' => Joblevel::all(),
        ]);
    }

    public function store(Request $request)
    {
        // Logic to handle the printing of ID cards for candidates
    }
}
