<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryResource;
use App\Services\Inventory\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * GET /api/inventory
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->inventoryService->getList(
                search: $request->input('search'),
                placeId: $request->input('place_id') ? (int) $request->input('place_id') : null,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => InventoryResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data inventory.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/inventory/place/{placeId}
     */
    public function byPlace(Request $request, int $placeId): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->inventoryService->getByPlace($placeId, $perPage, $page);

            return response()->json([
                'status' => true,
                'data' => InventoryResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory byPlace error', ['placeId' => $placeId, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat inventory berdasarkan tempat.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/inventory/product/{productId}
     */
    public function byProduct(Request $request, int $productId): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->inventoryService->getByProduct($productId, $perPage, $page);

            return response()->json([
                'status' => true,
                'data' => InventoryResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory byProduct error', ['productId' => $productId, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat inventory berdasarkan produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/inventory/total/{productId}
     */
    public function totalProduct(int $productId): JsonResponse
    {
        try {
            $total = $this->inventoryService->getTotalByProduct($productId);

            return response()->json([
                'status' => true,
                'data' => [
                    'product_id' => $productId,
                    'total_qty' => $total,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory totalProduct error', ['productId' => $productId, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat total stok produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/inventory/low-stock
     */
    public function lowStock(Request $request): JsonResponse
    {
        try {
            $threshold = max(1, (int) $request->input('threshold', 10));
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->inventoryService->getLowStock($threshold, $perPage, $page);

            return response()->json([
                'status' => true,
                'data' => InventoryResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory lowStock error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data stok rendah.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}