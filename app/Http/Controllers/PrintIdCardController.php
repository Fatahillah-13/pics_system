<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\Department;
use App\Models\Joblevel;
use App\Services\IdCardPrintingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PrintIdCardController extends Controller
{
    protected IdCardPrintingService $printingService;

    public function __construct(IdCardPrintingService $printingService)
    {
        $this->printingService = $printingService;
    }

    public function view(Request $request)
    {
        $filter = $request->query('filter', 'unprinted'); // 'unprinted', 'printed', or 'all'

        $query = Candidate::with(['joblevel', 'department'])
            ->whereNotNull('nik')
            ->whereNotNull('image_path');

        if ($filter === 'unprinted') {
            $query->where('is_printed', false);
        } elseif ($filter === 'printed') {
            $query->where('is_printed', true);
        }
        // 'all' doesn't add any filter

        return Inertia::render('NewCandidates/PrintIdCard', [
            'candidates' => $query->latest()->get(),
            'departments' => Department::all(),
            'joblevels' => Joblevel::all(),
            'serviceStatus' => $this->printingService->healthCheck(),
            'currentFilter' => $filter,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'candidate_ids' => 'required|array|min:1',
            'candidate_ids.*' => 'exists:candidates,id',
            'ctpat_ids' => 'nullable|array',
            'ctpat_ids.*' => 'integer',
        ]);

        try {
            // Get candidates with relationships
            $candidates = Candidate::with(['joblevel', 'department'])
                ->whereIn('id', $validated['candidate_ids'])
                ->get();

            // Check if service is available
            if (! $this->printingService->healthCheck()) {
                return back()->with('error', 'Service cetak ID Card tidak tersedia. Silakan hubungi administrator.');
            }

            // Print ID cards
            $result = $this->printingService->printCards($candidates, $validated['ctpat_ids'] ?? []);

            // Check if printing was successful
            if (isset($result[0]['status']) && $result[0]['status'] === 'success') {
                $pdfUrl = $result[0]['combined_output'];
                $totalCards = $result[0]['total_idcards'];
                $totalErrors = $result[0]['total_errors'] ?? 0;

                // Update is_printed status for successfully printed candidates
                Candidate::whereIn('id', $validated['candidate_ids'])
                    ->update(['is_printed' => true]);

                Log::info('ID Cards printed successfully', [
                    'total' => $totalCards,
                    'errors' => $totalErrors,
                    'pdf_url' => $pdfUrl,
                ]);

                return back()->with([
                    'success' => "Berhasil mencetak {$totalCards} ID Card.",
                    'pdf_url' => $pdfUrl,
                    'errors' => $totalErrors > 0 ? "{$totalErrors} kartu gagal dicetak." : null,
                ]);
            }

            return back()->with('error', 'Gagal mencetak ID Card. Silakan coba lagi.');

        } catch (\Exception $e) {
            Log::error('Error printing ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Terjadi kesalahan: '.$e->getMessage());
        }
    }
}
