<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductCustomer\StoreProductCustomerRequest;
use App\Http\Requests\ProductCustomer\UpdateProductCustomerRequest;
use App\Http\Resources\ProductCustomerResource;
use App\Models\Product;
use App\Services\ProductCustomer\ProductCustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductCustomerController extends Controller
{
    public function __construct(
        protected ProductCustomerService $productCustomerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 15), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->productCustomerService->getList(
                search: $request->input('search'),
                customerId: $request->input('customer_id') ? (int) $request->input('customer_id') : null,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductCustomer index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data product customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Product $product): JsonResponse
    {
        try {
            if (!$product->customer_id) {
                return response()->json(['status' => false, 'message' => 'Produk customer tidak ditemukan.'], 404);
            }

            $detail = $this->productCustomerService->getDetail($product->id);

            if (!$detail) {
                return response()->json(['status' => false, 'message' => 'Produk customer tidak ditemukan.'], 404);
            }

            return response()->json(['status' => true, 'data' => new ProductCustomerResource($product)]);
        } catch (\Throwable $e) {
            Log::error('ProductCustomer show error', ['id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'Gagal memuat detail product customer.'], 500);
        }
    }

    public function store(StoreProductCustomerRequest $request): JsonResponse
    {
        try {
            $product = $this->productCustomerService->create($request->validated());

            $this->productCustomerService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Produk customer berhasil dibuat.',
                'data' => new ProductCustomerResource($product),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('ProductCustomer store error', ['error' => $e->getMessage(), 'trace' => config('app.debug') ? $e->getTraceAsString() : null]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat produk customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateProductCustomerRequest $request, Product $product): JsonResponse
    {
        try {
            $updated = $this->productCustomerService->update($product, $request->validated());

            $this->productCustomerService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Produk customer berhasil diperbarui.',
                'data' => new ProductCustomerResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProductCustomer update error', ['id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui produk customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $result = $this->productCustomerService->delete($product);

            if ($result['success']) {
                $this->productCustomerService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('ProductCustomer destroy error', ['id' => $product->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus produk customer.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}