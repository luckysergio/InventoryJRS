<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Production\StoreProductionRequest;
use App\Http\Requests\Production\UpdateProductionRequest;
use App\Http\Resources\ProductionResource;
use App\Models\Production;
use App\Services\Dashboard\DashboardService;
use App\Services\Inventory\InventoryService;
use App\Services\Production\ProductionService;
use App\Services\Product\ProductService;
use App\Services\Transaksi\TransaksiService;
use App\Traits\BroadcastsDashboardEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ProductionController extends Controller
{
    use BroadcastsDashboardEvents;

    public function __construct(
        protected ProductionService $productionService,
        protected InventoryService $inventoryService,
        protected ProductService $productService,
        protected TransaksiService $transaksiService,
        protected DashboardService $dashboardService
    ) {}

    private function invalidateEcosystem(): void
    {
        $this->productionService->invalidateCache();
        $this->inventoryService->invalidateCache();
        $this->productService->invalidateCache();
        $this->transaksiService->invalidateCache();
        $this->invalidateDashboard();

        Log::info('Production ecosystem cache invalidated');
    }

    private function invalidateDashboard(): void
    {
        try {
            $this->dashboardService->invalidateAll();
            Log::info('Dashboard cache invalidated from ProductionController');
        } catch (\Throwable $e) {
            Log::warning('Failed to invalidate dashboard cache from ProductionController', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function index(): JsonResponse
    {
        try {
            $data = $this->productionService->getList();

            return response()->json([
                'status'  => true,
                'message' => 'Berhasil mengambil data produksi',
                'data'    => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('Production index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat data produksi.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Production $production): JsonResponse
    {
        try {
            $detail = $this->productionService->getDetail($production->id);

            if (!$detail) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Data produksi tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => $detail,
            ]);
        } catch (\Throwable $e) {
            Log::error('Production show error', [
                'id' => $production->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail produksi.',
            ], 500);
        }
    }

    public function store(StoreProductionRequest $request): JsonResponse
    {
        try {
            $production = $this->productionService->create($request->validated());

            $this->invalidateEcosystem();

            // ✅ Broadcast event
            $this->broadcastProductionEvent('created', [
                'id' => $production->id,
                'status' => $production->status,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Produksi berhasil dibuat.',
                'data'    => new ProductionResource($production),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Production store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal membuat produksi: ' . $e->getMessage(),
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateProductionRequest $request, Production $production): JsonResponse
    {
        try {
            $updated = $this->productionService->updateStatus($production, $request->validated());

            $this->invalidateEcosystem();

            // ✅ Broadcast event
            $this->broadcastProductionEvent('updated', [
                'id' => $production->id,
                'status' => $updated->status,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Status produksi berhasil diperbarui.',
                'data'    => new ProductionResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('Production update error', [
                'id' => $production->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memperbarui produksi: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(Production $production): JsonResponse
    {
        try {
            $result = $this->productionService->delete($production);

            if ($result['success']) {
                $this->invalidateEcosystem();

                // ✅ Broadcast event
                $this->broadcastProductionEvent('deleted', [
                    'id' => $production->id,
                ]);
            }

            return response()->json([
                'status'  => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('Production destroy error', [
                'id' => $production->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal menghapus produksi.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function pesananDipesan(): JsonResponse
    {
        try {
            $data = $this->productionService->getPesananSiapProduksi();

            return response()->json([
                'status'  => true,
                'message' => 'Pesanan siap produksi.',
                'data'    => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('Production pesananDipesan error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat pesanan siap produksi.',
            ], 500);
        }
    }
}