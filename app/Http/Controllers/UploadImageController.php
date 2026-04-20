<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UploadImageController extends Controller
{
    public function view()
    {
        $candidates = Candidate::whereNull('image_path')
            ->orWhere('image_path', '')
            ->with(['department', 'joblevel'])
            ->orderBy('name')
            ->get();

        return Inertia::render('NewCandidates/UploadImage', [
            'candidates' => $candidates,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'candidate_id' => 'required|exists:candidates,id',
            'image' => 'required|string',
        ]);

        $candidate = Candidate::findOrFail($request->candidate_id);

        $imageData = preg_replace('/^data:image\/\w+;base64,/', '', $request->image);
        $imageData = base64_decode($imageData);

        if ($imageData === false) {
            return back()->withErrors(['image' => 'Invalid image data.']);
        }

        $filename = 'candidates/' . $candidate->id . '_' . time() . '.jpg';
        Storage::disk('public')->put($filename, $imageData);

        // Delete old image if exists
        if ($candidate->image_path && Storage::disk('public')->exists($candidate->image_path)) {
            Storage::disk('public')->delete($candidate->image_path);
        }

        $candidate->update(['image_path' => $filename]);

        return back()->with('success', 'Photo uploaded successfully.');
    }
}
