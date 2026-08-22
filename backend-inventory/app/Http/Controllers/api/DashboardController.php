<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\DashboardStatsRequest;
use App\Http\Resources\Dashboard\DashboardStatsResource;
use App\Http\Resources\Dashboard\DashboardChartResource;
use App\Services\Dashboard\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * GET /api/dashboard
     * Endpoint lama (backward compatible)
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->dashboardService->getStats('daily');
            return response()->json([
                'status' => true,
                'data' => new DashboardStatsResource($data),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat dashboard',
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/stats?period=daily|weekly|monthly|yearly|custom|all&from=&to=&realtime=1
     * 
     * Endpoint baru dengan multi-period support
     * 
     * @example
     * - /api/dashboard/stats?period=daily
     * - /api/dashboard/stats?period=weekly
     * - /api/dashboard/stats?period=monthly
     * - /api/dashboard/stats?period=yearly
     * - /api/dashboard/stats?period=custom&from=2026-01-01&to=2026-08-22
     * - /api/dashboard/stats?period=daily&realtime=1 (bypass cache)
     */
    public function stats(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $period = $request->getPeriod();
            $realtime = $request->isRealtime();

            $from = $request->from ? Carbon::parse($request->from) : null;
            $to = $request->to ? Carbon::parse($request->to) : null;

            $data = $this->dashboardService->getStats($period, $from, $to, $realtime);
            
            // Tambahkan chart data ke response
            $chart = $this->dashboardService->getChart($request->getChartMonths());
            $data['chart_months'] = $request->getChartMonths();

            return response()->json([
                'status' => true,
                'data' => new DashboardStatsResource($data),
                'chart' => new DashboardChartResource($chart),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@stats error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat statistik dashboard: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/chart?months=6
     * Endpoint khusus chart (lightweight)
     */
    public function chart(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $months = $request->getChartMonths();
            $chart = $this->dashboardService->getChart($months);

            return response()->json([
                'status' => true,
                'data' => new DashboardChartResource($chart),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@chart error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat chart',
            ], 500);
        }
    }

    /**
     * GET /api/dashboard/realtime?period=daily
     * Endpoint khusus real-time (bypass cache)
     */
    public function realtime(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $period = $request->getPeriod();
            $data = $this->dashboardService->getStats($period, null, null, true);

            return response()->json([
                'status' => true,
                'data' => new DashboardStatsResource($data),
                'realtime' => true,
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@realtime error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data real-time',
            ], 500);
        }
    }

    /**
     * POST /api/dashboard/invalidate
     * Manual invalidate cache (untuk admin)
     */
    public function invalidate(): JsonResponse
    {
        try {
            $this->dashboardService->invalidateAll();
            
            return response()->json([
                'status' => true,
                'message' => 'Cache dashboard berhasil di-invalidate',
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@invalidate error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal invalidate cache',
            ], 500);
        }
    }
}