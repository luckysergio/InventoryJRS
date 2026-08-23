<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\DashboardStatsRequest;
use App\Http\Requests\Dashboard\LoginLogsRequest;
use App\Http\Resources\Dashboard\DashboardChartResource;
use App\Http\Resources\Dashboard\DashboardStatsResource;
use App\Http\Resources\Dashboard\LoginLogResource;
use App\Services\Dashboard\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | STATS & CHART
    |--------------------------------------------------------------------------
    */

    public function index(): JsonResponse
    {
        try {
            $data = $this->dashboardService->getStats('daily');

            return response()->json([
                'status' => true,
                'data'   => new DashboardStatsResource($data),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat dashboard',
            ], 500);
        }
    }

    public function stats(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $period   = $request->getPeriod();
            $realtime = $request->isRealtime();
            $from     = $request->from ? Carbon::parse($request->from) : null;
            $to       = $request->to ? Carbon::parse($request->to) : null;

            $data = $this->dashboardService->getStats($period, $from, $to, $realtime);

            $chart = $this->dashboardService->getChart($request->getChartMonths());
            $data['chart_months'] = $request->getChartMonths();

            return response()->json([
                'status' => true,
                'data'   => new DashboardStatsResource($data),
                'chart'  => new DashboardChartResource($chart),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@stats error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat statistik dashboard: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function chart(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $chart = $this->dashboardService->getChart($request->getChartMonths());

            return response()->json([
                'status' => true,
                'data'   => new DashboardChartResource($chart),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@chart error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat chart',
            ], 500);
        }
    }

    public function realtime(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $data = $this->dashboardService->getStats($request->getPeriod(), null, null, true);

            return response()->json([
                'status'   => true,
                'data'     => new DashboardStatsResource($data),
                'realtime' => true,
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@realtime error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat data real-time',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN LOGS (ENHANCED)
    |--------------------------------------------------------------------------
    */

    public function loginLogs(LoginLogsRequest $request): JsonResponse
    {
        try {
            $filters = [
                'period'  => $request->getPeriod(),
                'from'    => $request->getFrom(),
                'to'      => $request->getTo(),
                'search'  => $request->getSearch(),
                'success' => $request->getSuccessFilter(),
                'ip'      => $request->getIpFilter(),
            ];

            $result = $this->dashboardService->getLoginLogs(
                $filters,
                $request->getPerPage(),
                $request->getPage()
            );

            return response()->json([
                'status' => true,
                'data'   => LoginLogResource::collection(collect($result['data'])),
                'meta'   => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@loginLogs error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat login logs',
            ], 500);
        }
    }

    public function loginLogDetail(int $id): JsonResponse
    {
        try {
            $log = $this->dashboardService->getLoginLogDetail($id);

            if (!$log) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Login log tidak ditemukan',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => new LoginLogResource($log, isDetail: true),
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@loginLogDetail error', [
                'id'    => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail login log',
            ], 500);
        }
    }

    /**
     * ✅ UPDATED: Login stats sekarang menerima period/from/to
     * GET /api/dashboard/login-stats?period=daily|weekly|monthly|yearly|custom|all&from=&to=
     */
    public function loginStats(DashboardStatsRequest $request): JsonResponse
    {
        try {
            $from = $request->from ? Carbon::parse($request->from) : null;
            $to   = $request->to ? Carbon::parse($request->to) : null;

            $stats = $this->dashboardService->getLoginStats(
                $request->getPeriod(),
                $from,
                $to
            );

            return response()->json([
                'status' => true,
                'data'   => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@loginStats error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat login stats',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CACHE
    |--------------------------------------------------------------------------
    */

    public function invalidate(): JsonResponse
    {
        try {
            $this->dashboardService->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Cache dashboard berhasil di-invalidate',
            ]);
        } catch (\Throwable $e) {
            Log::error('DashboardController@invalidate error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal invalidate cache',
            ], 500);
        }
    }
}