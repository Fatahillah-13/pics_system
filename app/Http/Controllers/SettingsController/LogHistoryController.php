<?php

namespace App\Http\Controllers\SettingsController;

use App\Http\Controllers\Controller;
use App\Models\CardTemplate;
use App\Models\Department;
use App\Models\Joblevel;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;


class LogHistoryController extends Controller
{
    public function view(){
        return Inertia::render('Settings/LogHistory', [
            'logs' => ActivityLog::with(['candidate:id,name,nik', 'user:id,name'])
                ->latest()
                ->get(),
        ]);
    }
}
