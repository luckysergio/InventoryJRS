<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Production\StoreProductionRequest;
use App\Http\Requests\Production\UpdateProductionRequest;
use App\Http\Resources\ProductionResource;
use App\Models\Production;
use App\Services\Inventory\InventoryService;
use App\Services\Production\ProductionService;
use App\Services\Product\ProductService;
use App\Services\Transaksi\TransaksiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ProductionController extends Controller
{
    public function __construct(
        protected ProductionService $productionService,
        protected InventoryService $inventoryService,
        protected ProductService $productService,
        protected TransaksiService $transaksiService
    ) {}

    /**
     * Invalidate semua cache yang terdampak operasi produksi.
     */
    private function invalidateEcosystem(): void
    {
        $this->productionService->invalidateCache();
        $this->inventoryService->invalidateCache();
        $this->productService->invalidateCache();
        $this->transaksiService->invalidateCache();

        Log::info('Production ecosystem cache invalidated');
    }

    /**
     * GET /api/productions
     */
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

    /**
     * GET /api/productions/{production}
     */
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

    /**
     * POST /api/productions
     */
    public function store(StoreProductionRequest $request): JsonResponse
    {
        try {
            $production = $this->productionService->create($request->validated());

            $this->invalidateEcosystem();

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

    /**
     * PUT /api/productions/{production}
     */
    public function update(UpdateProductionRequest $request, Production $production): JsonResponse
    {
        try {
            $updated = $this->productionService->updateStatus($production, $request->validated());

            $this->invalidateEcosystem();

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

    /**
     * DELETE /api/productions/{production}
     */
    public function destroy(Production $production): JsonResponse
    {
        try {
            $result = $this->productionService->delete($production);

            if ($result['success']) {
                $this->invalidateEcosystem();
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

    /**
     * GET /api/productions/pesanan/dipesan
     * Return transaksi details siap produksi (status "Di Pesan").
     */
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