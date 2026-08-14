<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
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

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 50);
        $page = max((int) $request->input('page', 1), 1);

        $products = $this->productService->getList(
            search: $request->input('search'),
            jenisId: $request->input('jenis_id') ? (int) $request->input('jenis_id') : null,
            typeId: $request->input('type_id') ? (int) $request->input('type_id') : null,
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil data product',
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        $detail = $this->productService->getDetail($product->id);
        return response()->json(['status' => true, 'data' => $detail]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Produk berhasil dibuat',
            'data'    => $product->load(['jenis', 'type', 'bahan'])
        ], 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $updatedProduct = $this->productService->update($product, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Produk berhasil diperbarui',
            'data'    => $updatedProduct->load(['jenis', 'type', 'bahan'])
        ]);
    }

    // ✅ PERBAIKAN DI SINI: Logging & Error Handling yang Eksplisit
    public function destroy(Product $product): JsonResponse
    {
        Log::info('Delete request received for Product', [
            'id' => $product->id,
            'kode' => $product->kode
        ]);

        try {
            $result = $this->productService->delete($product);

            return response()->json([
                'status'  => true,
                'message' => $result['message']
            ]);
        } catch (\Throwable $e) {
            // ✅ Jika gagal (misal: foreign key constraint), kirim status 500
            // agar frontend masuk ke blok `onError` di useDeleteProduct
            Log::error('Failed to delete product', [
                'id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status'  => false,
                'message' => 'Gagal menghapus: ' . $e->getMessage()
            ], 500);
        }
    }

    public function available(): JsonResponse
    {
        $products = $this->productService->getAvailableProducts();
        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil produk tersedia di TOKO',
            'data'    => $products
        ]);
    }

    public function lowStock(): JsonResponse
    {
        $products = $this->productService->getLowStockProducts();
        return response()->json([
            'status'  => true,
            'message' => 'Produk dengan total stok TOKO + BENGKEL < 20',
            'data'    => $products
        ]);
    }

    public function bestSeller(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->get('limit', 10);
            $dari = $request->get('dari');
            $sampai = $request->get('sampai');

            $result = $this->productService->getBestSellerProducts($limit, $dari, $sampai);

            return response()->json([
                'status' => true,
                'message' => 'Berhasil mengambil produk terlaris',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Terjadi kesalahan saat mengambil data',
                'error' => env('APP_DEBUG', false) ? $e->getMessage() : null
            ], 500);
        }
    }
}