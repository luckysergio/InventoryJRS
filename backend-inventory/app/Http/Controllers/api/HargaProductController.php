<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HargaProduct\StoreHargaProductRequest;
use App\Http\Requests\HargaProduct\UpdateHargaProductRequest;
use App\Models\HargaProduct;
use App\Services\HargaProduct\HargaProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HargaProductController extends Controller
{
    public function __construct(
        protected HargaProductService $hargaProductService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);
        $page = max((int) $request->input('page', 1), 1);

        $data = $this->hargaProductService->getList(
            search: $request->input('search'),
            productId: $request->input('product_id') ? (int) $request->input('product_id') : null,
            customerId: $request->input('customer_id') ? (int) $request->input('customer_id') : null,
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status' => true,
            'data'   => $data, // Laravel otomatis men-serialize paginator object
        ]);
    }

    // ✅ FIXED: Tambahkan type hint string|int
    public function show(string|int $id): JsonResponse
    {
        $hargaProduct = HargaProduct::find((int) $id);
        
        if (!$hargaProduct) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $detail = $this->hargaProductService->getDetail($hargaProduct->id);

        return response()->json([
            'status' => true,
            'data'   => $detail,
        ]);
    }

    public function store(StoreHargaProductRequest $request): JsonResponse
    {
        $harga = $this->hargaProductService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan.',
            'data'    => $harga,
        ], 201);
    }

    // ✅ FIXED: Tambahkan type hint string|int
    public function update(UpdateHargaProductRequest $request, string|int $id): JsonResponse
    {
        $hargaProduct = HargaProduct::find((int) $id);

        if (!$hargaProduct) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $updatedHarga = $this->hargaProductService->update($hargaProduct, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui.',
            'data'    => $updatedHarga,
        ]);
    }

    // ✅ FIXED: Tambahkan type hint string|int
    public function destroy(string|int $id): JsonResponse
    {
        $hargaProduct = HargaProduct::find((int) $id);

        if (!$hargaProduct) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $result = $this->hargaProductService->delete($hargaProduct);

        return response()->json([
            'status'  => $result['success'],
            'message' => $result['message'],
        ]);
    }
}