<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class UploadImageController extends Controller
{
    public function view(){
        return Inertia::render('NewCandidates/UploadImage');
    }
}
