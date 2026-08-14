<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductDistributor\StoreProductDistributorRequest;
use App\Http\Requests\ProductDistributor\UpdateProductDistributorRequest;
use App\Models\Product;
use App\Services\ProductDistributor\ProductDistributorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductDistributorController extends Controller
{
    public function __construct(
        protected ProductDistributorService $productDistributorService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 50);
        $page = max((int) $request->input('page', 1), 1);

        $products = $this->productDistributorService->getList(
            search: $request->input('search'),
            jenisId: $request->input('jenis_id') ? (int) $request->input('jenis_id') : null,
            typeId: $request->input('type_id') ? (int) $request->input('type_id') : null,
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil data product distributor',
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    // ✅ FIXED: Terima $id agar sinkron dengan route /{id}
    public function show(string|int $id): JsonResponse
    {
        $product = Product::with(['jenis', 'type', 'bahan', 'distributor'])->find((int) $id);
        
        if (!$product) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        return response()->json(['status' => true, 'data' => $product]);
    }

    public function store(StoreProductDistributorRequest $request): JsonResponse
    {
        $product = $this->productDistributorService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Product distributor berhasil dibuat',
            'data'    => $product->load(['jenis', 'type', 'bahan', 'distributor'])
        ], 201);
    }

    // ✅ FIXED: Terima $id agar sinkron dengan route /{id}
    public function update(UpdateProductDistributorRequest $request, string|int $id): JsonResponse
    {
        $product = Product::find((int) $id);

        if (!$product) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $updatedProduct = $this->productDistributorService->update($product, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Product distributor berhasil diperbarui',
            'data'    => $updatedProduct
        ]);
    }

    // ✅ FIXED: Terima $id agar sinkron dengan route /{id}
    public function destroy(string|int $id): JsonResponse
    {
        $product = Product::find((int) $id);

        if (!$product) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $result = $this->productDistributorService->delete($product);

        return response()->json([
            'status'  => $result['success'],
            'message' => $result['message']
        ]);
    }
}