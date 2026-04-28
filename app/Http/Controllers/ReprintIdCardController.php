<?php

namespace App\Http\Controllers;

use App\Imports\ReprintPreviewImport;
use App\Models\Candidate;
use App\Models\CardTemplate;
use App\Services\IdCardPrintingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReprintIdCardController extends Controller
{
    protected IdCardPrintingService $printingService;

    public function __construct(IdCardPrintingService $printingService)
    {
        $this->printingService = $printingService;
    }

    public function view()
    {
        return Inertia::render('RePrint/Reprint', [
            'serviceStatus' => $this->printingService->healthCheck(),
        ]);
    }

    public function searchEmployees(Request $request): JsonResponse
    {
        $search = $request->query('search', '');

        try {
            $response = Http::timeout(10)
                ->get('http://10.10.100.193:1002/api.employees.v1/employees', [
                    'search' => $search,
                ]);

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menghubungi server karyawan.'], 503);
        }
    }

    /**
     * Attempt to locate employee photo from the HRD network share.
     * If found, copy it to local storage so the ID card service can access it.
     * Returns the storage-relative path (e.g. "reprint_photos/12345.jpg") or null.
     */
    private function resolvePhotoFromNetworkShare(string $nik): ?string
    {
        $networkDir = '\\\\10.10.100.237\\hrd\\HRD DEPARTMENT\\ANDY@HR-Team\\Foto Karyawan HWI';
        $sourceFile = $networkDir . '\\' . $nik . '.jpg';

        if (! @file_exists($sourceFile)) {
            return null;
        }

        $destDir = storage_path('app/public/reprint_photos');
        if (! is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        $destFile = $destDir . DIRECTORY_SEPARATOR . $nik . '.jpg';

        if (! @copy($sourceFile, $destFile)) {
            Log::warning('Failed to copy employee photo from network share', [
                'source' => $sourceFile,
                'destination' => $destFile,
                'nik' => $nik,
            ]);
            return null;
        }

        return 'reprint_photos/' . $nik . '.jpg';
    }

    public function importPreview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            $sheets = Excel::toArray(new ReprintPreviewImport(), $request->file('file'));
            $rows   = $sheets[0] ?? [];
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membaca file: '.$e->getMessage()], 422);
        }

        // Filter ulang untuk membuang phantom rows yang mungkin lolos dari import class
        $rows = array_values(array_filter($rows, fn($r) => ($r['nik'] ?? '') !== '' || ($r['name'] ?? '') !== ''));

        if (empty($rows)) {
            return response()->json(['error' => 'File tidak memiliki data yang valid.'], 422);
        }

        if (count($rows) > 50) {
            return response()->json(['error' => 'Maksimal 50 baris per import.'], 422);
        }

        $preview = [];
        foreach ($rows as $index => $row) {
            $nik  = $row['nik']  ?? '';
            $name = $row['name'] ?? '';

            $errors = [];
            if ($nik === '')  $errors[] = 'NIK kosong';
            if ($name === '') $errors[] = 'Nama kosong';

            $department  = '';
            $jobLevel    = '';
            $hasPhoto    = false;
            $photoSource = null;

            if ($nik !== '') {
                // Try network share first for photo
                $networkPhoto = $this->resolvePhotoFromNetworkShare($nik);
                if ($networkPhoto) {
                    $hasPhoto    = true;
                    $photoSource = 'network';
                }

                // Look up dept / job_level from external API
                try {
                    $response = Http::timeout(5)
                        ->get('http://10.10.100.193:1002/api.employees.v1/employees', [
                            'search' => $nik,
                        ]);
                    if ($response->ok()) {
                        $apiData  = $response->json('data', []);
                        $employee = collect($apiData)->firstWhere('number_of_employees', $nik);
                        if ($employee) {
                            $department = $employee['department'] ?? '';
                            $jobLevel   = $employee['job_level']  ?? '';
                        }
                    }
                } catch (\Exception) {
                    // API tidak tersedia, biarkan department/jobLevel kosong
                }

                // Fallback foto: cek image_path di tabel candidates
                if (! $hasPhoto) {
                    $candidate = Candidate::where('nik', $nik)->value('image_path');
                    if ($candidate) {
                        $hasPhoto    = true;
                        $photoSource = 'db';
                    }
                }
            }

            $preview[] = [
                'row'          => $index + 1,
                'nik'          => $nik,
                'name'         => $name,
                'department'   => $department,
                'job_level'    => $jobLevel,
                'has_photo'    => $hasPhoto,
                'photo_source' => $photoSource,
                'errors'       => $errors,
                'valid'        => empty($errors),
            ];
        }

        $totalValid = count(array_filter($preview, fn($r) => $r['valid']));

        return response()->json([
            'rows'    => $preview,
            'summary' => [
                'total'   => count($preview),
                'valid'   => $totalValid,
                'invalid' => count($preview) - $totalValid,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cards'               => 'required|array|min:1|max:50',
            'cards.*.name'        => 'required|string',
            'cards.*.department'  => 'nullable|string',
            'cards.*.job_level'   => 'nullable|string',
            'cards.*.employee_id' => 'required|string',
            'cards.*.ctpat'       => 'sometimes|boolean',
        ]);

        // Resolve photo_filename and card_template from local DB for each card
        $cards = collect($validated['cards'])->map(function ($card) {
            $candidate = Candidate::with(['joblevel', 'department'])
                ->where('nik', $card['employee_id'])
                ->first();

            // Priority: network share photo → candidate image_path → fallback {nik}.jpg
            $networkPhoto = $this->resolvePhotoFromNetworkShare($card['employee_id']);
            $photoFilename = $networkPhoto ?? $candidate?->image_path ?? ($card['employee_id'].'.jpg');

            $cardTemplate = 'templates/default_template.png';
            $ctpatFlag = isset($card['ctpat']) ? (bool) $card['ctpat'] : null;
            if ($candidate) {
                $template = CardTemplate::findForCandidate(
                    $candidate->joblevel_id,
                    $candidate->department_id,
                    $ctpatFlag
                ) ?? CardTemplate::first();
                $cardTemplate = $template?->template_path ?? $cardTemplate;
            } else {
                $template = CardTemplate::where('ctpat', (bool) $ctpatFlag)->first()
                    ?? CardTemplate::first();
                $cardTemplate = $template?->template_path ?? $cardTemplate;
            }

            return [
                'name' => $card['name'],
                'department' => $card['department'],
                'job_level' => $card['job_level'],
                'employee_id' => $card['employee_id'],
                'photo_filename' => $photoFilename,
                'card_template' => $cardTemplate,
            ];
        })->toArray();

        try {
            // Check if service is available
            if (! $this->printingService->healthCheck()) {
                return back()->with('error', 'Service cetak ID Card tidak tersedia. Silakan hubungi administrator.');
            }

            // Print ID cards
            $result = $this->printingService->printCards($cards);

            // Check if printing was successful
            if (isset($result[0]['status']) && $result[0]['status'] === 'success') {
                $pdfUrl = $result[0]['combined_output'];
                $totalCards = $result[0]['total_idcards'];
                $totalErrors = $result[0]['total_errors'] ?? 0;

                Log::info('ID Cards reprinted successfully', [
                    'total' => $totalCards,
                    'errors' => $totalErrors,
                    'pdf_url' => $pdfUrl,
                ]);

                return back()->with([
                    'success' => "Berhasil mencetak ulang {$totalCards} ID Card.",
                    'pdf_url' => $pdfUrl,
                    'errors' => $totalErrors > 0 ? "{$totalErrors} kartu gagal dicetak." : null,
                ]);
            }

            return back()->with('error', 'Gagal mencetak ID Card. Silakan coba lagi.');

        } catch (\Exception $e) {
            Log::error('Error reprinting ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Terjadi kesalahan: '.$e->getMessage());
        }
    }
}
