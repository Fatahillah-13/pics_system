<?php

namespace App\Http\Controllers;

use App\Imports\ReprintPreviewImport;
use App\Models\Candidate;
use App\Models\CardTemplate;
use App\Models\Department;
use App\Models\Joblevel;
use App\Models\ActivityLog;
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
     * Lookup a single employee by NIK and resolve photo availability.
     */
    /**
     * Check photo availability for a given NIK (network share + DB).
     * Employee data is resolved by the browser directly from the external API.
     */
    public function lookupEmployee(Request $request): JsonResponse
    {
        $nik = trim($request->query('nik', ''));

        if ($nik === '') {
            return response()->json(['error' => 'NIK tidak boleh kosong.'], 422);
        }

        $hasPhoto    = false;
        $photoSource = null;

        // Resolve photo from API
        $networkPhoto = $this->resolvePhotoFromApi($nik);
        if ($networkPhoto) {
            $hasPhoto    = true;
            $photoSource = 'network';
        }

        // Fallback photo: DB
        if (! $hasPhoto) {
            $candidate = Candidate::where('nik', $nik)->value('image_path');
            if ($candidate) {
                $hasPhoto    = true;
                $photoSource = 'db';
            }
        }

        return response()->json([
            'nik'          => $nik,
            'has_photo'    => $hasPhoto,
            'photo_source' => $photoSource,
        ]);
    }

    private function normalizeDepartment(string $department): string
    {
        // Strip suffix after hyphen (e.g. "QIP-F" → "QIP")
        $department = trim(explode('-', $department)[0]);

        // Normalize "SEWING COMP *" → "SEWING COMP"
        if (stripos($department, 'SEWING COMP') === 0) {
            $department = 'SEWING COMP';
        }

        // Normalize "SEWING MEKANIK *" → "SEWING MEKANIK"
        if (stripos($department, 'SEWING MEKANIK') === 0) {
            $department = 'SEWING MEKANIK';
        }

        // Normalize "TECHNICAL ROLLING *" → "TECHNICAL ROLLING"
        if (stripos($department, 'TECHNICAL ROLLING') === 0) {
            $department = 'TECHNICAL ROLLING';
        }

        // Normalize "FINISH GOOD *" → "FINISH GOOD"
        if (stripos($department, 'FINISH GOOD') === 0) {
            $department = 'FINISH GOOD';
        }

        // Normalize "ASSEMBLY *" → "ASSEMBLY"
        if (stripos($department, 'ASSEMBLY') === 0) {
            $department = 'ASSEMBLY';
        }

        // Normalize "QIP *" → "QIP"
        if (stripos($department, 'QIP') === 0) {
            $department = 'QIP';
        }

        return $department;
    }

    private function resolvePhotoFromApi(string $nik): ?string
    {
        try {
            $response = Http::timeout(10)
                ->get('http://10.10.40.238:9090/photo', [
                    'number_of_employee' => $nik,
                ]);

            if (! $response->successful() || empty($response->body())) {
                return null;
            }

            $destDir = storage_path('app/public/reprint_photos');
            if (! is_dir($destDir)) {
                mkdir($destDir, 0755, true);
            }

            $destFile = $destDir . DIRECTORY_SEPARATOR . $nik . '.jpg';

            if (file_put_contents($destFile, $response->body()) === false) {
                Log::warning('Failed to save employee photo from API', [
                    'nik' => $nik,
                    'url' => 'http://10.10.40.238:9090/photo?number_of_employee=' . $nik,
                ]);
                return null;
            }

            return 'reprint_photos/' . $nik . '.jpg';
        } catch (\Exception $e) {
            Log::warning('Failed to fetch employee photo from API', [
                'nik'   => $nik,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
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
                // Try photo API first
                $networkPhoto = $this->resolvePhotoFromApi($nik);
                if ($networkPhoto) {
                    $hasPhoto    = true;
                    $photoSource = 'network';
                }

                // Look up name, dept / job_level from external API
                try {
                    $response = Http::timeout(5)
                        ->get('http://10.10.100.193:1002/api.employees.v1/employees', [
                            'search' => $nik,
                        ]);
                    if ($response->ok()) {
                        $apiData  = $response->json('data', []);
                        $employee = collect($apiData)->firstWhere('number_of_employees', $nik);
                        if ($employee) {
                            $name       = $employee['name']       ?? $name;
                            $department = $this->normalizeDepartment($employee['department'] ?? '');
                            $jobLevel   = $employee['job_level']  ?? '';
                        }
                    }
                } catch (\Exception) {
                    // API tidak tersedia, gunakan nama dari Excel
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
            $card['department'] = $this->normalizeDepartment($card['department'] ?? '');

            $candidate = Candidate::with(['joblevel', 'department'])
                ->where('nik', $card['employee_id'])
                ->first();

            // Priority: photo API → candidate image_path → fallback {nik}.jpg
            $networkPhoto = $this->resolvePhotoFromApi($card['employee_id']);
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
                // Resolve IDs from department/joblevel names provided by the API
                $joblevelId   = Joblevel::whereRaw('LOWER(name) = ?', [strtolower($card['job_level'] ?? '')])->value('id');
                $departmentId = Department::whereRaw('LOWER(name) = ?', [strtolower($card['department'] ?? '')])->value('id');

                $template = CardTemplate::findForCandidate($joblevelId, $departmentId, $ctpatFlag)
                    ?? CardTemplate::where('ctpat', (bool) $ctpatFlag)->first()
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

                foreach ($cards as $card) {
                    $candidate = Candidate::where('nik', $card['employee_id'])->first();
                    ActivityLog::create([
                        'candidate_id' => $candidate?->id,
                        'nik'          => $card['employee_id'],
                        'user_id'      => auth()->id(),
                        'action'       => 'reprint',
                        'notes'        => "ID Card untuk {$card['name']} (NIK: {$card['employee_id']}) dicetak ulang",
                    ]);
                }

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

    // Reprint Custom ID Card Methods
    public function viewCustom()
    {
        return Inertia::render('RePrint/CustomPrint', [
            'serviceStatus' => $this->printingService->healthCheck(),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'joblevels' => Joblevel::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Get all available card templates
     */
    public function getTemplates(): JsonResponse
    {
        $templates = CardTemplate::select('id', 'name', 'template_path', 'description', 'ctpat')
            ->orderBy('name')
            ->get()
            ->map(fn($t) => [
                'value' => $t->template_path,
                'label' => $t->name,
                'description' => $t->description ?? '',
                'ctpat' => $t->ctpat,
            ]);

        return response()->json($templates);
    }

    /**
     * Store custom reprint with manual options
     */
    public function storeCustom(Request $request)
    {
        $validated = $request->validate([
            'cards' => 'required|array|min:1|max:50',
            'cards.*.name' => 'required|string',
            'cards.*.employee_id' => 'required|string',
            'cards.*.department' => 'nullable|string',
            'cards.*.job_level' => 'nullable|string',
            'cards.*.custom_template' => 'sometimes|string', // For Korean manual input
            'cards.*.photo_base64' => 'sometimes|string', // Uploaded photo in base64

            // Custom options
            'options.bypass_format' => 'sometimes|boolean',
            'options.custom_template' => 'sometimes|string',
            'options.name_offset_y' => 'sometimes|integer',
            'options.custom_font_size' => 'sometimes|integer',
            'options.preset' => 'sometimes|string|in:korean,long-name',
        ]);

        $options = $validated['options'] ?? [];

        // Apply preset configurations
        if (isset($options['preset'])) {
            $options = $this->applyPreset($options['preset'], $options);
        }

        $cards = collect($validated['cards'])->map(function ($card) use ($options) {
            $card['department'] = $this->normalizeDepartment($card['department'] ?? '');

            // Check if uploaded photo exists (for Korean employees)
            if (!empty($card['photo_base64'])) {
                // Photo will be handled as base64 string by Python service
                $photoFilename = null;
                $photoBase64 = $card['photo_base64'];
            } else {
                // Resolve photo from API or DB (for Indonesian employees)
                $networkPhoto = $this->resolvePhotoFromApi($card['employee_id']);
                $photoFilename = $networkPhoto
                    ?? Candidate::where('nik', $card['employee_id'])->value('image_path')
                    ?? ($card['employee_id'] . '.jpg');
                $photoBase64 = null;
            }

            // Determine template
            // Priority: card-specific template (for Korean manual input) > global option > auto-select
            $cardTemplate = $card['custom_template'] ?? $options['custom_template'] ?? null;

            if (!$cardTemplate) {
                // Auto-select based on department/joblevel if not manually selected
                $candidate = Candidate::with(['joblevel', 'department'])
                    ->where('nik', $card['employee_id'])
                    ->first();

                if ($candidate) {
                    $template = CardTemplate::findForCandidate(
                        $candidate->joblevel_id,
                        $candidate->department_id
                    );
                    $cardTemplate = $template?->template_path ?? 'templates/default_template.png';
                } else {
                    $cardTemplate = 'templates/default_template.png';
                }
            }

            return [
                'name' => $card['name'],
                'department' => $card['department'] ?? '',
                'job_level' => $card['job_level'] ?? '',
                'employee_id' => $card['employee_id'],
                'photo_filename' => $photoFilename,
                'photo_base64' => $photoBase64,
                'card_template' => $cardTemplate,

                // Custom parameters for Python service
                'bypass_format' => $options['bypass_format'] ?? false,
                'custom_name_offset_y' => $options['name_offset_y'] ?? 0,
                'custom_font_size' => $options['custom_font_size'] ?? null,
            ];
        })->toArray();

        try {
            // Check if service is available
            if (!$this->printingService->healthCheck()) {
                return back()->with('error', 'Service cetak ID Card tidak tersedia. Silakan hubungi administrator.');
            }

            // Print ID cards with custom options
            $result = $this->printingService->printCustomCards($cards);

            // Check if printing was successful
            if (isset($result[0]['status']) && $result[0]['status'] === 'success') {
                $pdfUrl = $result[0]['combined_output'];
                $totalCards = $result[0]['total_idcards'];
                $totalErrors = $result[0]['total_errors'] ?? 0;

                Log::info('Custom ID Cards printed successfully', [
                    'total' => $totalCards,
                    'errors' => $totalErrors,
                    'pdf_url' => $pdfUrl,
                    'preset' => $options['preset'] ?? 'custom',
                ]);

                foreach ($cards as $card) {
                    $candidate = Candidate::where('nik', $card['employee_id'])->first();
                    ActivityLog::create([
                        'candidate_id' => $candidate?->id,
                        'nik' => $card['employee_id'],
                        'user_id' => auth()->id(),
                        'action' => 'reprint_custom',
                        'notes' => "Custom ID Card untuk {$card['name']} (NIK: {$card['employee_id']}) dicetak (preset: " . ($options['preset'] ?? 'manual') . ")",
                    ]);
                }

                return back()->with([
                    'success' => "Berhasil mencetak {$totalCards} Custom ID Card.",
                    'pdf_url' => $pdfUrl,
                    'errors' => $totalErrors > 0 ? "{$totalErrors} kartu gagal dicetak." : null,
                ]);
            }

            return back()->with('error', 'Gagal mencetak ID Card. Silakan coba lagi.');

        } catch (\Exception $e) {
            Log::error('Error printing custom ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Apply preset configuration
     */
    private function applyPreset(string $preset, array $existingOptions): array
    {
        $presets = [
            'korean' => [
                'bypass_format' => true,
                'name_offset_y' => 0,
                'custom_font_size' => null,
            ],
            'long-name' => [
                'bypass_format' => true,
                'custom_template' => 'templates/template_indonesian_long.png',
                'name_offset_y' => -5,
                'custom_font_size' => 18,
            ],
        ];

        $presetConfig = $presets[$preset] ?? [];

        // Merge preset with existing options (existing options take precedence)
        return array_merge($presetConfig, $existingOptions);
    }
}
