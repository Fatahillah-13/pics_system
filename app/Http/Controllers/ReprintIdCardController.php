<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\CardTemplate;
use App\Services\IdCardPrintingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cards' => 'required|array|min:1|max:10',
            'cards.*.name' => 'required|string',
            'cards.*.department' => 'required|string',
            'cards.*.job_level' => 'required|string',
            'cards.*.employee_id' => 'required|string',
        ]);

        // Resolve photo_filename and card_template from local DB for each card
        $cards = collect($validated['cards'])->map(function ($card) {
            $candidate = Candidate::with(['joblevel', 'department'])
                ->where('nik', $card['employee_id'])
                ->first();

            $photoFilename = $candidate?->image_path ?? ($card['employee_id'].'.jpg');

            $cardTemplate = 'templates/default_template.png';
            if ($candidate) {
                $template = CardTemplate::findForCandidate(
                    $candidate->joblevel_id,
                    $candidate->department_id,
                    false
                ) ?? CardTemplate::first();
                $cardTemplate = $template?->template_path ?? $cardTemplate;
            } else {
                $template = CardTemplate::first();
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
