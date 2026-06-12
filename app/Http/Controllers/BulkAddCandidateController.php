<?php

namespace App\Http\Controllers;

use App\Imports\CandidateBulkPreviewImport;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class BulkAddCandidateController extends Controller
{
    public function view()
    {
        return Inertia::render('NewCandidates/BulkAdd', [
            'departments' => Department::all(),
            'joblevels' => Joblevel::all(),
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            $sheets = Excel::toArray(new CandidateBulkPreviewImport, $request->file('file'));
            $rows = $sheets[0] ?? [];
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membaca file: ' . $e->getMessage()], 422);
        }

        // Filter out completely empty rows
        $rows = array_values(array_filter($rows, fn($row) => !empty(array_filter($row, fn($v) => $v !== null && $v !== ''))));

        // Parse date fields so preview shows human-readable dates (not Excel serial numbers)
        $rows = array_map(function ($row) {
            $row['birthdate']         = $this->parseDate($row['birthdate'] ?? null);
            $row['first_working_day'] = $this->parseDate($row['first_working_day'] ?? null);
            return $row;
        }, $rows);

        return response()->json(['rows' => $rows]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'candidates' => 'required|string',
        ]);

        $candidates = json_decode($request->candidates, true);

        if (!is_array($candidates) || empty($candidates)) {
            return back()->withErrors(['candidates' => 'Data kandidat tidak valid.']);
        }

        $photos = $request->file('photos', []);
        $saved = 0;
        $ids = [];

        foreach ($candidates as $index => $data) {
            $joblevelId = $data['joblevel_id'] ?? null;
            $departmentId = $data['department_id'] ?? null;

            // Fallback: resolve by name if IDs not provided
            if (!$joblevelId && !empty($data['job_level'])) {
                $joblevelId = Joblevel::where('name', $data['job_level'])->value('id');
            }
            if (!$departmentId && !empty($data['department'])) {
                $departmentId = Department::where('name', $data['department'])->value('id');
            }

            $candidate = Candidate::create([
                'name'             => $data['name'] ?? '',
                'nik'              => $data['nik'] ?? null,
                'photo_number'     => $data['photo_number'] ?? null,
                'joblevel_id'      => $joblevelId,
                'department_id'    => $departmentId,
                'birthplace'       => $data['birthplace'] ?? null,
                'birthdate'        => $this->parseDate($data['birthdate'] ?? null),
                'first_working_day' => $this->parseDate($data['first_working_day'] ?? null),
                'image_path'       => null,
            ]);

            $ids[] = $candidate->id;
            $saved++;

            ActivityLog::create([
                'action' => 'create',
                'candidate_id' => $candidate->id,
                'user_id' => auth()->id(),
                'description' => "Kandidat {$candidate->name} ditambahkan melalui bulk import",
            ]);
        }

        return response()->json([
            'message' => $saved . ' kandidat berhasil disimpan.',
            'saved'   => $saved,
            'ids'     => $ids,
        ]);
    }

    public function storePhotos(Request $request)
    {
        $photos = $request->file('photos', []);
        $ids    = $request->input('ids', []);

        foreach ($photos as $i => $file) {
            $candidateId = $ids[$i] ?? null;
            if (!$candidateId) {
                continue;
            }

            $candidate = Candidate::find($candidateId);
            if (!$candidate) {
                continue;
            }

            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'candidates/' . $candidate->id . '_' . time() . '.' . $ext;
            Storage::disk('public')->putFileAs('candidates', $file, basename($filename));
            $candidate->update(['image_path' => $filename]);
        }

        return response()->json(['ok' => true]);
    }

    private function parseDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // PhpSpreadsheet kadang mengembalikan objek DateTime langsung
        if ($value instanceof \DateTimeInterface) {
            return \Carbon\Carbon::instance($value)->format('Y-m-d');
        }

        if (is_numeric($value)) {
            return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
        }

        $formats = ['d/m/Y', 'Y-m-d', 'd-m-Y', 'm/d/Y', 'd/m/Y H:i:s', 'Y-m-d H:i:s'];
        foreach ($formats as $format) {
            try {
                return \Carbon\Carbon::createFromFormat($format, $value)->format('Y-m-d');
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }
}
