<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryResource;
use App\Services\Inventory\InventoryService;
use App\Services\StokOpname\StokOpnameService;
use App\Services\Product\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected StokOpnameService $stokOpnameService,
        protected ProductService $productService
    ) {}

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

    public function stokMap(Request $request): JsonResponse
    {
        try {
            $placeKode = $request->input('place', 'TOKO');

            $allowedPlaces = ['TOKO', 'BENGKEL', 'GUDANG'];
            if (!in_array($placeKode, $allowedPlaces, true)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Place tidak valid. Allowed: ' . implode(', ', $allowedPlaces),
                ], 422);
            }

            $stokMap = $this->inventoryService->getStokMap($placeKode);

            return response()->json([
                'status' => true,
                'data' => $stokMap ?: new \stdClass(),
                'meta' => [
                    'place' => $placeKode,
                    'total_products' => count($stokMap),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory stokMap error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat stok map.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function sync(): JsonResponse
    {
        try {
            $this->inventoryService->invalidateCache();
            $this->stokOpnameService->invalidateCache();
            $this->productService->invalidateCache();

            Log::info('Inventory cache force synced');

            return response()->json([
                'status' => true,
                'message' => 'Cache inventory berhasil disinkronisasi.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Inventory sync error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal sinkronisasi cache.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}