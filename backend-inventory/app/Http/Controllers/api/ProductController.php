<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\Dashboard\DashboardService;
use App\Services\HargaProduct\HargaProductService;
use App\Services\Product\ProductService;
use App\Services\ProductCustomer\ProductCustomerService;
use App\Services\ProductDistributor\ProductDistributorService;
use App\Traits\BroadcastsDashboardEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    use BroadcastsDashboardEvents;

    public function __construct(
        protected ProductService $productService,
        protected ProductCustomerService $productCustomerService,
        protected ProductDistributorService $productDistributorService,
        protected HargaProductService $hargaProductService,
        protected DashboardService $dashboardService
    ) {}

    private function invalidateProductEcosystem(): void
    {
        $this->productService->invalidateCache();
        $this->productCustomerService->invalidateCache();
        $this->productDistributorService->invalidateCache();
        $this->hargaProductService->invalidateCache();
        $this->invalidateDashboard();

        Log::info('Product ecosystem cache invalidated');
    }

    private function invalidateDashboard(): void
    {
        try {
            $this->dashboardService->invalidateAll();
            Log::info('Dashboard cache invalidated from ProductController');
        } catch (\Throwable $e) {
            Log::warning('Failed to invalidate dashboard cache from ProductController', [
                'error' => $e->getMessage(),
            ]);
        }
    }

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

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = $this->productService->create($request->validated());

            $this->invalidateProductEcosystem();

            // ✅ Broadcast event
            $this->broadcastProductEvent('created', [
                'id' => $product->id,
                'kode' => $product->kode,
            ]);

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

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        try {
            $updated = $this->productService->update($product, $request->validated());

            $this->invalidateProductEcosystem();

            // ✅ Broadcast event
            $this->broadcastProductEvent('updated', [
                'id' => $product->id,
                'kode' => $product->kode,
            ]);

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

    public function destroy(Product $product): JsonResponse
    {
        try {
            $result = $this->productService->delete($product);

            if ($result['success']) {
                $this->invalidateProductEcosystem();

                // ✅ Broadcast event
                $this->broadcastProductEvent('deleted', [
                    'id' => $product->id,
                    'kode' => $product->kode,
                ]);
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

    public function uploadFoto(Request $request, Product $product): JsonResponse
    {
        try {
            $validated = $request->validate([
                'foto_depan'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
                'foto_samping' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
                'foto_atas'    => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            ], [
                'foto_depan.image'   => 'Foto depan harus berupa gambar.',
                'foto_depan.mimes'   => 'Format foto depan harus JPG, PNG, atau WebP.',
                'foto_depan.max'     => 'Foto depan maksimal 10MB.',
                'foto_samping.image' => 'Foto samping harus berupa gambar.',
                'foto_samping.mimes' => 'Format foto samping harus JPG, PNG, atau WebP.',
                'foto_samping.max'   => 'Foto samping maksimal 10MB.',
                'foto_atas.image'    => 'Foto atas harus berupa gambar.',
                'foto_atas.mimes'    => 'Format foto atas harus JPG, PNG, atau WebP.',
                'foto_atas.max'      => 'Foto atas maksimal 10MB.',
            ]);

            if (
                !$request->hasFile('foto_depan') &&
                !$request->hasFile('foto_samping') &&
                !$request->hasFile('foto_atas')
            ) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Pilih minimal 1 foto untuk diupload.',
                ], 422);
            }

            $updated = $this->productService->updatePhotos($product, [
                'foto_depan'   => $request->file('foto_depan'),
                'foto_samping' => $request->file('foto_samping'),
                'foto_atas'    => $request->file('foto_atas'),
            ]);

            $this->invalidateProductEcosystem();

            return response()->json([
                'status'  => true,
                'message' => 'Foto produk berhasil diupload.',
                'data'    => new ProductResource($updated),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Product uploadFoto error', [
                'id'    => $product->id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal mengupload foto: ' . $e->getMessage(),
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function available(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->productService->getAvailableProducts(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product available error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat produk tersedia.',
            ], 500);
        }
    }

    public function lowStock(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->productService->getLowStockProducts(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Product lowStock error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat produk stok rendah.',
            ], 500);
        }
    }

    public function bestSeller(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->input('limit', 10);
            $limit = max(1, min(100, $limit));

            $dari = $request->input('dari');
            $sampai = $request->input('sampai');

            if ($dari && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dari)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Format parameter "dari" harus YYYY-MM-DD.',
                ], 422);
            }

            if ($sampai && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $sampai)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Format parameter "sampai" harus YYYY-MM-DD.',
                ], 422);
            }

            if ($dari && $sampai && strcmp($sampai, $dari) < 0) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tanggal "sampai" harus >= tanggal "dari".',
                ], 422);
            }

            $jenis = $request->input('jenis');
            if ($jenis !== null && !in_array($jenis, ['daily', 'pesanan'], true)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Parameter "jenis" harus "daily" atau "pesanan".',
                ], 422);
            }

            $data = $this->productService->getBestSellerProducts(
                limit: $limit,
                dari: $dari,
                sampai: $sampai,
                jenis: $jenis
            );

            return response()->json([
                'status' => true,
                'data' => $data,
                'meta' => [
                    'total' => count($data),
                    'limit' => $limit,
                    'dari' => $dari,
                    'sampai' => $sampai,
                    'jenis' => $jenis,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Product bestSeller error', [
                'error' => $e->getMessage(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat produk terlaris.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}