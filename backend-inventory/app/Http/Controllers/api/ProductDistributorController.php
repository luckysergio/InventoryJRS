<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductDistributor\StoreProductDistributorRequest;
use App\Http\Requests\ProductDistributor\UpdateProductDistributorRequest;
use App\Http\Resources\ProductDistributorResource;
use App\Models\Product;
use App\Services\HargaProduct\HargaProductService;
use App\Services\Product\ProductService;
use App\Services\ProductCustomer\ProductCustomerService;
use App\Services\ProductDistributor\ProductDistributorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductDistributorController extends Controller
{
    public function __construct(
        protected ProductDistributorService $productDistributorService,
        protected ProductService $productService,
        protected ProductCustomerService $productCustomerService,
        protected HargaProductService $hargaProductService
    ) {}

    /**
     * Invalidate SEMUA cache dalam ekosistem produk.
     * 
     * Dipanggil setelah CRUD product distributor, karena perubahan akan mempengaruhi:
     * - Product (master)
     * - ProductCustomer (produk customer)
     * - HargaProduct (daftar harga)
     */
    private function invalidateProductEcosystem(): void
    {
        $this->productService->invalidateCache();
        $this->productCustomerService->invalidateCache();
        $this->productDistributorService->invalidateCache();
        $this->hargaProductService->invalidateCache();

        Log::info('Product ecosystem cache invalidated (from ProductDistributor)');
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 15), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->productDistributorService->getList(
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
            Log::error('ProductDistributor index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data product distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Product $product): JsonResponse
    {
        try {
            if (!$product->distributor_id) {
                return response()->json([
                    'status' => false,
                    'message' => 'Product distributor tidak ditemukan.',
                ], 404);
            }

            $detail = $this->productDistributorService->getDetail($product->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Product distributor tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => $detail,
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductDistributor show error', ['id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail product distributor.',
            ], 500);
        }
    }

    public function store(StoreProductDistributorRequest $request): JsonResponse
    {
        try {
            $product = $this->productDistributorService->create($request->validated());

            $this->invalidateProductEcosystem();

            return response()->json([
                'status' => true,
                'message' => 'Product distributor berhasil dibuat.',
                'data' => new ProductDistributorResource($product),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('ProductDistributor store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat product distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateProductDistributorRequest $request, Product $product): JsonResponse
    {
        try {
            $updated = $this->productDistributorService->update($product, $request->validated());

            $this->invalidateProductEcosystem();

            return response()->json([
                'status' => true,
                'message' => 'Product distributor berhasil diperbarui.',
                'data' => new ProductDistributorResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductDistributor update error', [
                'id' => $product->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui product distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $result = $this->productDistributorService->delete($product);

            if ($result['success']) {
                $this->invalidateProductEcosystem();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('ProductDistributor destroy error', [
                'id' => $product->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus product distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}