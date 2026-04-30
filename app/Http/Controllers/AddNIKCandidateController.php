<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Inertia\Inertia;

class AddNIKCandidateController extends Controller
{
    public function view()
    {
        return Inertia::render('NewCandidates/AddNik', [
            'candidates' => Candidate::with(['joblevel', 'department'])
                ->whereNotNull('image_path')
                ->where('image_path', '!=', '')
                ->where(function ($query) {
                    $query->whereNull('nik')->orWhere('nik', '');
                })
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'candidate_id' => 'required|exists:candidates,id',
            'nik'          => 'required|string|max:50|unique:candidates,nik',
        ]);

        $candidate = Candidate::findOrFail($request->candidate_id);
        $candidate->update(['nik' => $request->nik]);

        ActivityLog::create([
            'action' => 'update',
            'model' => 'Candidate',
            'model_id' => $candidate->id,
            'description' => "NIK kandidat {$candidate->name} diperbarui",
        ]);

        return back()->with('success', 'NIK berhasil disimpan untuk ' . $candidate->name . '.');
    }

    public function storeMany(Request $request)
    {
        $request->validate([
            'data'                 => 'required|array|min:1',
            'data.*.candidate_id'  => 'required|exists:candidates,id',
            'data.*.nik'           => 'required|string|max:50',
        ]);

        $niks = collect($request->data)->pluck('nik');

        // Detect duplicates within the batch
        if ($niks->unique()->count() !== $niks->count()) {
            return back()->withErrors(['data' => 'Terdapat NIK duplikat dalam daftar yang dikirim.']);
        }

        // Detect conflict with existing NIKs in DB
        $existing = Candidate::whereIn('nik', $niks->all())->pluck('nik');
        if ($existing->isNotEmpty()) {
            return back()->withErrors(['data' => 'NIK berikut sudah digunakan: ' . $existing->implode(', ')]);
        }

        foreach ($request->data as $item) {
            Candidate::where('id', $item['candidate_id'])->update(['nik' => $item['nik']]);

            ActivityLog::create([
                'action' => 'update',
                'model' => 'Candidate',
                'model_id' => $item['candidate_id'],
                'description' => "NIK kandidat dengan ID {$item['candidate_id']} diperbarui",
            ]);
        }

        return back()->with('success', count($request->data) . ' NIK berhasil disimpan.');
    }
}
