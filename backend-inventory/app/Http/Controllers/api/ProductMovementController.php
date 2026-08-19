<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductMovement\StoreProductMovementRequest;
use App\Http\Resources\ProductMovementResource;
use App\Services\ProductMovement\ProductMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductMovementController extends Controller
{
    public function __construct(
        protected ProductMovementService $productMovementService
    ) {}

    /**
     * GET /api/product-movements
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->productMovementService->getList(
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

    /**
     * POST /api/product-movements
     */
    public function store(StoreProductMovementRequest $request): JsonResponse
    {
        try {
            $this->productMovementService->create($request->validated());

            // Invalidate cache setelah transaction commit
            $this->productMovementService->invalidateCache();

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