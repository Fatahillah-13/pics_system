<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Joblevel;
use App\Services\IdCardPrintingService;
use Illuminate\Http\Request;
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
            'departments' => Department::all(),
            'joblevels' => Joblevel::all(),
            'serviceStatus' => $this->printingService->healthCheck(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cards' => 'required|array|min:1',
            'cards.*.name' => 'required|string',
            'cards.*.department' => 'required|string',
            'cards.*.job_level' => 'required|string',
            'cards.*.employee_id' => 'required|string',
            'cards.*.photo_filename' => 'required|string',
            'cards.*.card_template' => 'required|string',
        ]);

        try {
            // Check if service is available
            if (!$this->printingService->healthCheck()) {
                return back()->with('error', 'Service cetak ID Card tidak tersedia. Silakan hubungi administrator.');
            }

            // Print ID cards
            $result = $this->printingService->printCards($validated['cards']);

            // Check if printing was successful
            if (isset($result[0]['status']) && $result[0]['status'] === 'success') {
                $pdfUrl = $result[0]['combined_output'];
                $totalCards = $result[0]['total_idcards'];
                $totalErrors = $result[0]['total_errors'] ?? 0;

                Log::info('ID Cards reprinted successfully', [
                    'total' => $totalCards,
                    'errors' => $totalErrors,
                    'pdf_url' => $pdfUrl
                ]);

                return back()->with([
                    'success' => "Berhasil mencetak ulang {$totalCards} ID Card.",
                    'pdf_url' => $pdfUrl,
                    'errors' => $totalErrors > 0 ? "{$totalErrors} kartu gagal dicetak." : null
                ]);
            }

            return back()->with('error', 'Gagal mencetak ID Card. Silakan coba lagi.');

        } catch (\Exception $e) {
            Log::error('Error reprinting ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}
