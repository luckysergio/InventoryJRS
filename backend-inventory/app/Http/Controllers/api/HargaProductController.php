<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HargaProduct\StoreHargaProductRequest;
use App\Http\Requests\HargaProduct\UpdateHargaProductRequest;
use App\Http\Resources\HargaProductResource;
use App\Models\HargaProduct;
use App\Services\HargaProduct\HargaProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HargaProductController extends Controller
{
    public function __construct(
        protected HargaProductService $hargaProductService
    ) {
    }

    /**
     * GET /api/harga
     * Get paginated list dengan filter product/customer.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->input('search');
            $productId = $request->input('product_id') ? (int) $request->input('product_id') : null;
            $customerId = $request->input('customer_id') ? (int) $request->input('customer_id') : null;
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->hargaProductService->getList(
                search: $search,
                productId: $productId,
                customerId: $customerId,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => HargaProductResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data harga product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/harga/by-product/{productId}
     * Get semua harga untuk product tertentu.
     */
    public function byProduct(int $productId): JsonResponse
    {
        try {
            $hargaProducts = $this->hargaProductService->getByProduct($productId);

            return response()->json([
                'status' => true,
                'data' => HargaProductResource::collection($hargaProducts),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data harga product.',
            ], 500);
        }
    }

    /**
     * GET /api/harga/active/{productId}
     * Get harga aktif untuk product + customer (digunakan saat transaksi).
     */
    public function activePrice(int $productId, Request $request): JsonResponse
    {
        try {
            $customerId = $request->input('customer_id') ? (int) $request->input('customer_id') : null;
            $harga = $this->hargaProductService->getActivePrice($productId, $customerId);

            if (!$harga) {
                return response()->json([
                    'status' => false,
                    'message' => 'Harga aktif tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new HargaProductResource($harga),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat harga aktif.',
            ], 500);
        }
    }

    /**
     * GET /api/harga/{hargaProduct}
     * Route model binding otomatis return 404 jika tidak ada.
     */
    public function show(HargaProduct $hargaProduct): JsonResponse
    {
        try {
            $detail = $this->hargaProductService->getDetail($hargaProduct->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Harga product tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new HargaProductResource($detail),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail harga product.',
            ], 500);
        }
    }

    /**
     * POST /api/harga
     */
    public function store(StoreHargaProductRequest $request): JsonResponse
    {
        try {
            $harga = $this->hargaProductService->create($request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Harga product berhasil ditambahkan.',
                'data' => new HargaProductResource($harga),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal menambahkan harga product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * PUT /api/harga/{hargaProduct}
     */
    public function update(UpdateHargaProductRequest $request, HargaProduct $hargaProduct): JsonResponse
    {
        try {
            $updated = $this->hargaProductService->update($hargaProduct, $request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Harga product berhasil diperbarui.',
                'data' => new HargaProductResource($updated),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui harga product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * DELETE /api/harga/{hargaProduct}
     */
    public function destroy(HargaProduct $hargaProduct): JsonResponse
    {
        try {
            $result = $this->hargaProductService->delete($hargaProduct);

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus harga product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}