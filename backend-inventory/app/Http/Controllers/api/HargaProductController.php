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
            'data'   => $data,
        ]);
    }

    public function currentPrice(int $productId, Request $request): JsonResponse
    {
        $customerId = $request->query('customer_id') ? (int) $request->query('customer_id') : null;
        
        $harga = $this->hargaProductService->getCurrentPrice($productId, $customerId);

        return response()->json([
            'status' => true,
            'data'   => $harga,
        ]);
    }

    public function show(HargaProduct $hargaProduct): JsonResponse
    {
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
            'message' => 'Harga berhasil ditambahkan.',
            'data'    => $harga,
        ], 201);
    }

    public function update(UpdateHargaProductRequest $request, HargaProduct $hargaProduct): JsonResponse
    {
        $updatedHarga = $this->hargaProductService->update($hargaProduct, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Harga berhasil diperbarui.',
            'data'    => $updatedHarga,
        ]);
    }

    public function destroy(HargaProduct $hargaProduct): JsonResponse
    {
        $result = $this->hargaProductService->delete($hargaProduct);

        return response()->json([
            'status'  => $result['success'],
            'message' => $result['message'],
        ]);
    }
}