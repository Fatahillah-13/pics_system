<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\CardTemplate;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
     * @param  array|Collection  $candidates
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
            'service_url' => $this->serviceUrl,
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
                'total' => $result[0]['total_idcards'] ?? 0,
            ]);

            return $result;

        } catch (Exception $e) {
            Log::error('Failed to print ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new Exception('Gagal mencetak ID Card: '.$e->getMessage());
        }
    }

    protected function formatName(string $name): string
    {
        $words = explode(' ', trim($name));
        if (count($words) <= 2) {
            return $name;
        }

        $firstTwo = array_slice($words, 0, 2);
        $rest = array_slice($words, 2);

        $abbreviated = array_map(fn ($word) => strtoupper($word[0]).'.', $rest);

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

        if (stripos($department, 'SEWING COMP') === 0) {
            $department = 'SEWING COMP';
        }
        if (stripos($department, 'SEWING MEKANIK') === 0) {
            $department = 'SEWING MEKANIK';
        }
        if (stripos($department, 'TECHNICAL ROLLING') === 0) {
            $department = 'TECHNICAL ROLLING';
        }
        if (stripos($department, 'FINISH GOOD') === 0) {
            $department = 'FINISH GOOD';
        }
        if (stripos($department, 'ASSEMBLY') === 0) {
            $department = 'ASSEMBLY';
        }
        if (stripos($department, 'QIP') === 0) {
            $department = 'QIP';
        }

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
        $template = CardTemplate::findForCandidate(
            $candidate->joblevel_id,
            $candidate->department_id,
            $isCtpat
        );

        if (! $template) {
            // Fallback to first available template
            $template = CardTemplate::first();
        }

        return $template?->template_path ?? 'templates/default_template.png';
    }

    /**
     * Print custom ID cards with manual options (bypass formatting, custom templates, etc.)
     *
     * @param  array  $cards
     */
    public function printCustomCards(array $cards): array
    {
        $formattedCandidates = collect($cards)->map(function ($card) {
            // Check if name formatting should be bypassed
            $name = isset($card['bypass_format']) && $card['bypass_format'] === true
                ? $card['name']
                : $this->formatName($card['name']);

            $formatted = [
                'name' => $name,
                'department' => $card['department'] ?? '',
                'job_level' => $card['job_level'] ?? '',
                'employee_id' => $card['employee_id'] ?? '',
                'card_template' => $card['card_template'] ?? 'templates/default_template.png',
            ];

            // Handle photo: either base64 upload or filename
            if (!empty($card['photo_base64'])) {
                $formatted['photo_base64'] = $card['photo_base64'];
                $formatted['photo_filename'] = null;
            } else {
                $formatted['photo_filename'] = $card['photo_filename'] ?? '';
            }

            // Add custom parameters if present
            if (isset($card['custom_name_offset_y'])) {
                $formatted['custom_name_offset_y'] = $card['custom_name_offset_y'];
            }
            if (isset($card['custom_font_size'])) {
                $formatted['custom_font_size'] = $card['custom_font_size'];
            }

            return $formatted;
        })->toArray();

        Log::info('Sending custom print request to ID Card Service', [
            'count' => count($formattedCandidates),
            'service_url' => $this->serviceUrl,
            'has_custom_params' => collect($formattedCandidates)->contains(function ($card) {
                return isset($card['custom_name_offset_y']) || isset($card['custom_font_size']);
            }),
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->post("{$this->serviceUrl}/print", $formattedCandidates);

            if ($response->failed()) {
                throw new Exception("ID Card service returned error: {$response->status()}");
            }

            $result = $response->json();

            Log::info('Custom ID Card Service response received', [
                'success' => isset($result[0]['status']) && $result[0]['status'] === 'success',
                'total' => $result[0]['total_idcards'] ?? 0,
            ]);

            return $result;

        } catch (Exception $e) {
            Log::error('Failed to print custom ID cards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new Exception('Gagal mencetak Custom ID Card: '.$e->getMessage());
        }
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
