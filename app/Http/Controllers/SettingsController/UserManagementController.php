<?php

namespace App\Http\Controllers\SettingsController;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function view(){
        return Inertia::render('Settings/UserManagement', [
            'candidates' => Candidate::all(),
            'departments' => Department::all(),
            'joblevels' => Joblevel::all(),
        ]);
    }
}
