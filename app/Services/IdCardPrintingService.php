<?php

namespace App\Services;

use App\Models\Candidate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class IdCardPrintingService
{
    protected string $serviceUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->serviceUrl = config('services.idcard.url', 'http://127.0.0.1:5000');
        $this->timeout = config('services.idcard.timeout', 60);
    }

    /**
     * Check if the ID card service is available
     */
    public function healthCheck(): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->serviceUrl}/");
            return $response->successful();
        } catch (Exception $e) {
            Log::error('ID Card Service health check failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Print ID cards for given candidates
     *
     * @param array|\Illuminate\Support\Collection $candidates
     * @return array
     */
    public function printCards($candidates, array $ctpatIds = []): array
    {
        // Format candidate data for Python service
        $ctpatIdSet = array_flip($ctpatIds);
        $formattedCandidates = collect($candidates)->map(function ($candidate) use ($ctpatIdSet) {
            $isCtpat = $candidate instanceof Candidate && isset($ctpatIdSet[$candidate->id]);
            return $this->formatCandidateData($candidate, $isCtpat);
        })->toArray();

        Log::info('Sending print request to ID Card Service', [
            'count' => count($formattedCandidates),
            'service_url' => $this->serviceUrl
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->post("{$this->serviceUrl}/print", $formattedCandidates);

            if ($response->failed()) {
                throw new Exception("ID Card service returned error: {$response->status()}");
            }

            $result = $response->json();

            Log::info('ID Card Service response received', [
                'success' => isset($result[0]['status']) && $result[0]['status'] === 'success',
                'total' => $result[0]['total_idcards'] ?? 0
            ]);

            return $result;

        } catch (Exception $e) {
            Log::error('Failed to print ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new Exception('Gagal mencetak ID Card: ' . $e->getMessage());
        }
    }

    protected function formatName(string $name): string {
        $words = explode(' ', trim($name));
        if(count($words) <= 2) {
            return $name;
        }

        $firstTwo = array_slice($words, 0, 2);
        $rest = array_slice($words, 2);

        $abbreviated = array_map(fn($word) => strtoupper($word[0]) . '.' , $rest);
        return implode(' ', array_merge($firstTwo, $abbreviated));
    }

    /**
     * Format candidate data for Python service
     */
    protected function formatCandidateData($candidate, bool $isCtpat = false): array
    {
        // If it's a Candidate model
        if ($candidate instanceof Candidate) {
            // Load relationships if not loaded
            $candidate->loadMissing(['joblevel', 'department']);

            // Determine template based on department/joblevel and CTPAT status
            $template = $this->determineTemplate($candidate, $isCtpat);

            return [
                'name' => $this->formatName($candidate->name),
                'department' => $this->normalizeDepartment($candidate->department->name ?? 'N/A'),
                'job_level' => $candidate->joblevel->name ?? 'N/A',
                'employee_id' => $candidate->nik ?? 'N/A',
                'photo_filename' => $candidate->image_path,
                'card_template' => $template,
            ];
        }

        // If it's already an array (for reprint scenarios)
        return [
            'name' => $this->formatName($candidate['name'] ?? ''),
            'department' => $candidate['department'] ?? '',
            'job_level' => $candidate['job_level'] ?? '',
            'employee_id' => $candidate['employee_id'] ?? '',
            'photo_filename' => $candidate['photo_filename'] ?? '',
            'card_template' => $candidate['card_template'] ?? '',
        ];
    }

    protected function normalizeDepartment(string $department): string
    {
        $department = trim(explode('-', $department)[0]);

        if (stripos($department, 'SEWING COMP') === 0)       $department = 'SEWING COMP';
        if (stripos($department, 'SEWING MEKANIK') === 0)    $department = 'SEWING MEKANIK';
        if (stripos($department, 'TECHNICAL ROLLING') === 0) $department = 'TECHNICAL ROLLING';
        if (stripos($department, 'FINISH GOOD') === 0)       $department = 'FINISH GOOD';
        if (stripos($department, 'ASSEMBLY') === 0)          $department = 'ASSEMBLY';

        return $department;
    }

    /**
     * Determine which template to use based on candidate data
     */
    protected function determineTemplate(Candidate $candidate, bool $isCtpat = false): string
    {
        // Load relationships
        $candidate->loadMissing(['joblevel', 'department']);

        // Find matching template using the model method
        $template = \App\Models\CardTemplate::findForCandidate(
            $candidate->joblevel_id,
            $candidate->department_id,
            $isCtpat
        );

        if (!$template) {
            // Fallback to first available template
            $template = \App\Models\CardTemplate::first();
        }

        return $template?->template_path ?? 'templates/default_template.png';
    }

    /**
     * Get service configuration
     */
    public function getConfig(): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->serviceUrl}/config");
            return $response->successful() ? $response->json() : [];
        } catch (Exception $e) {
            return [];
        }
    }
}
