<?php

namespace App\Http\Middleware;

use App\Services\IdCardPrintingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckIdCardService
{
    protected IdCardPrintingService $printingService;

    public function __construct(IdCardPrintingService $printingService)
    {
        $this->printingService = $printingService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->printingService->healthCheck()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'ID Card printing service is unavailable'
                ], 503);
            }

            return back()->with('warning', 'Service cetak ID Card sedang tidak tersedia. Beberapa fitur mungkin tidak berfungsi.');
        }

        return $next($request);
    }
}
