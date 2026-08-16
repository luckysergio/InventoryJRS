<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\Product\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    /**
     * GET /api/products
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 15), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->productService->getList(
                search: $request->input('search'),
                jenisId: $request->input('jenis_id') ? (int) $request->input('jenis_id') : null,
                typeId: $request->input('type_id') ? (int) $request->input('type_id') : null,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Product index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ✅ BARU: GET /api/products/dropdown
     * Lightweight data untuk dropdown select.
     * HARUS didefinisikan SEBELUM route {product} di routes/api.php
     */
    public function dropdown(): JsonResponse
    {
        try {
            $products = Product::select(['id', 'kode', 'ukuran', 'jenis_id', 'type_id', 'bahan_id'])
                ->with([
                    'jenis:id,nama',
                    'type:id,nama',
                    'bahan:id,nama',
                ])
                ->orderBy('kode', 'asc')
                ->get();

            return response()->json([
                'status' => true,
                'data' => $products->map(fn($p) => [
                    'value' => $p->id,
                    'label' => implode(' • ', array_filter([
                        $p->kode,
                        $p->jenis?->nama,
                        $p->type?->nama,
                        $p->ukuran,
                    ])),
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product dropdown error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown product.',
            ], 500);
        }
    }

    /**
     * GET /api/products/{product}
     */
    public function show(Product $product): JsonResponse
    {
        try {
            $detail = $this->productService->getDetail($product->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Product tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => $detail,
            ]);
        } catch (\Throwable $e) {
            Log::error('Product show error', ['id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail product.',
            ], 500);
        }
    }

    /**
     * POST /api/products
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = $this->productService->create($request->validated());

            // Invalidate cache SETELAH transaction commit
            $this->productService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Produk berhasil dibuat.',
                'data' => new ProductResource($product),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Product store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * PUT /api/products/{product}
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        try {
            $updated = $this->productService->update($product, $request->validated());

            // Invalidate cache SETELAH transaction commit
            $this->productService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Produk berhasil diperbarui.',
                'data' => new ProductResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product update error', [
                'id' => $product->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * DELETE /api/products/{product}
     */
    public function destroy(Product $product): JsonResponse
    {
        try {
            $result = $this->productService->delete($product);

            // Hanya invalidate jika delete berhasil
            if ($result['success']) {
                $this->productService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('Product destroy error', [
                'id' => $product->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/products/available
     */
    public function available(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->productService->getAvailableProducts(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product available error', ['error' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Gagal memuat produk tersedia.'], 500);
        }
    }

    /**
     * GET /api/products/lowStok
     */
    public function lowStock(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->productService->getLowStockProducts(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product lowStock error', ['error' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Gagal memuat produk stok rendah.'], 500);
        }
    }

    /**
     * GET /api/products/best-seller
     */
    public function bestSeller(Request $request): JsonResponse
    {
        try {
            $limit = min((int) $request->input('limit', 10), 50);
            return response()->json([
                'status' => true,
                'data' => $this->productService->getBestSellerProducts(
                    $limit,
                    $request->input('dari'),
                    $request->input('sampai')
                ),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product bestSeller error', ['error' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Gagal memuat produk terlaris.'], 500);
        }
    }
}