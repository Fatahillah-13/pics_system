<?php

namespace App\Http\Controllers;

use App\Exports\CandidateBulkEditExport;
use App\Imports\CandidateBulkEditImport;
use App\Models\ActivityLog;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class BulkEditController extends Controller
{
    public function downloadTemplate()
    {
        return Excel::download(new CandidateBulkEditExport, 'bulk_edit_kandidat.xlsx');
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        // Guard against stray PHP notices/output corrupting the JSON response
        ob_start();
        try {
            $sheets = Excel::toArray(new CandidateBulkEditImport, $request->file('file'));
            $rows = $sheets[0] ?? [];
        } catch (\Exception $e) {
            ob_end_clean();
            return response()->json(['error' => 'Gagal membaca file: ' . $e->getMessage()], 422);
        }
        ob_end_clean();

        if (empty($rows)) {
            return response()->json(['error' => 'File tidak memiliki data yang valid.'], 422);
        }

        if (count($rows) > 500) {
            return response()->json(['error' => 'Maksimal 500 baris per proses.'], 422);
        }

        // Key by a normalized (trimmed, lowercased) name so minor case/spacing
        // differences in the uploaded file don't silently drop a field from the diff.
        $normalize = fn (string $name): string => mb_strtolower(trim($name));
        $joblevels = Joblevel::pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [$normalize($name) => $id]);
        $departments = Department::pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [$normalize($name) => $id]);

        $changes = [];
        $notFound = [];
        $invalidValues = [];
        $seenNiks = [];

        foreach ($rows as $index => $row) {
            $nik = trim((string) ($row['nik'] ?? ''));
            $name = trim((string) ($row['name'] ?? ''));
            $jobLevelName = trim((string) ($row['job_level'] ?? ''));
            $departmentName = trim((string) ($row['department'] ?? ''));
            $rowNum = $index + 2; // account for the heading row

            if ($nik === '' || isset($seenNiks[$nik])) {
                continue;
            }
            $seenNiks[$nik] = true;

            $candidate = Candidate::with(['joblevel', 'department'])->where('nik', $nik)->first();

            if (! $candidate) {
                $notFound[] = ['row' => $rowNum, 'nik' => $nik, 'name' => $name];
                continue;
            }

            $joblevelId = $jobLevelName !== '' ? ($joblevels[$normalize($jobLevelName)] ?? null) : null;
            $departmentId = $departmentName !== '' ? ($departments[$normalize($departmentName)] ?? null) : null;

            if ($jobLevelName !== '' && ! $joblevelId) {
                $invalidValues[] = ['row' => $rowNum, 'nik' => $nik, 'field' => 'job_level', 'value' => $jobLevelName];
            }
            if ($departmentName !== '' && ! $departmentId) {
                $invalidValues[] = ['row' => $rowNum, 'nik' => $nik, 'field' => 'department', 'value' => $departmentName];
            }

            $diff = [];
            if ($name !== '' && $name !== $candidate->name) {
                $diff['name'] = ['from' => $candidate->name, 'to' => $name];
            }
            if ($joblevelId && $joblevelId !== $candidate->joblevel_id) {
                $diff['job_level'] = ['from' => $candidate->joblevel?->name, 'to' => $jobLevelName];
            }
            if ($departmentId && $departmentId !== $candidate->department_id) {
                $diff['department'] = ['from' => $candidate->department?->name, 'to' => $departmentName];
            }

            if (empty($diff)) {
                continue;
            }

            $changes[] = [
                'row' => $rowNum,
                'candidate_id' => $candidate->id,
                'nik' => $nik,
                'name' => $name !== '' ? $name : $candidate->name,
                'joblevel_id' => $joblevelId ?: $candidate->joblevel_id,
                'department_id' => $departmentId ?: $candidate->department_id,
                'diff' => $diff,
            ];
        }

        return response()->json([
            'changes' => $changes,
            'not_found' => $notFound,
            'invalid_values' => $invalidValues,
            'total_rows' => count($rows),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'changes' => 'required|array|min:1',
            'changes.*.candidate_id' => 'required|integer|exists:candidates,id',
            'changes.*.name' => 'required|string|max:255',
            'changes.*.joblevel_id' => 'required|exists:joblevels,id',
            'changes.*.department_id' => 'required|exists:departments,id',
        ]);

        $updated = 0;

        DB::transaction(function () use ($validated, &$updated) {
            foreach ($validated['changes'] as $change) {
                $candidate = Candidate::find($change['candidate_id']);
                if (! $candidate) {
                    continue;
                }

                $candidate->update([
                    'name' => $change['name'],
                    'joblevel_id' => $change['joblevel_id'],
                    'department_id' => $change['department_id'],
                ]);

                ActivityLog::create([
                    'action' => 'bulk_update',
                    'candidate_id' => $candidate->id,
                    'nik' => $candidate->nik,
                    'user_id' => auth()->id(),
                    'notes' => "Kandidat {$candidate->name} diperbarui melalui bulk update",
                ]);

                $updated++;
            }
        });

        return redirect()->back()->with('success', "{$updated} kandidat berhasil diperbarui.");
    }
}
