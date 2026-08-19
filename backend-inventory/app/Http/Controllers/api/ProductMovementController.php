<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductMovement\StoreProductMovementRequest;
use App\Http\Resources\ProductMovementResource;
use App\Services\Inventory\InventoryService;
use App\Services\ProductMovement\ProductMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductMovementController extends Controller
{
    public function __construct(
        protected ProductMovementService $productMovementService,
        protected InventoryService $inventoryService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->productMovementService->getList(
                search: $request->input('search'),
                tipe: $request->input('tipe'),
                dari: $request->input('dari'),
                sampai: $request->input('sampai'),
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => ProductMovementResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductMovement index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data mutasi produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StoreProductMovementRequest $request): JsonResponse
    {
        try {
            $this->productMovementService->create($request->validated());

            // Invalidate kedua cache (movement + inventory berubah)
            $this->productMovementService->invalidateCache();
            $this->inventoryService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Mutasi produk berhasil.',
            ], 201);
        } catch (\Throwable $e) {
            Log::error('ProductMovement store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            $statusCode = str_contains($e->getMessage(), 'Stok tidak mencukupi') ? 422 : 500;

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}