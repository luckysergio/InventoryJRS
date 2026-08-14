<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BahanProduct\StoreBahanProductRequest;
use App\Http\Requests\BahanProduct\UpdateBahanProductRequest;
use App\Models\BahanProduct;
use App\Services\BahanProduct\BahanProductService;
use Illuminate\Http\JsonResponse;

class BahanProductController extends Controller
{
    public function __construct(
        protected BahanProductService $bahanProductService
    ) {}

    public function index(): JsonResponse
    {
        $data = $this->bahanProductService->getList(withCount: true);

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    // ✅ FIXED: Terima $id, cari manual agar sinkron dengan route /{id}
    public function show(string|int $id): JsonResponse
    {
        $bahanProduct = BahanProduct::find((int) $id);
        
        if (!$bahanProduct) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $detail = $this->bahanProductService->getDetail($bahanProduct->id);

        return response()->json([
            'status' => true,
            'data'   => $detail,
        ]);
    }

    public function store(StoreBahanProductRequest $request): JsonResponse
    {
        $bahan = $this->bahanProductService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan.',
            'data'    => $bahan,
        ], 201);
    }

    // ✅ FIXED: Terima $id, cari manual
    public function update(UpdateBahanProductRequest $request, string|int $id): JsonResponse
    {
        $bahanProduct = BahanProduct::find((int) $id);

        if (!$bahanProduct) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $updatedBahan = $this->bahanProductService->update($bahanProduct, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui.',
            'data'    => $updatedBahan,
        ]);
    }

    public function destroy(string|int $id): JsonResponse
    {
        $bahanProduct = BahanProduct::find((int) $id);

        if (!$bahanProduct) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $result = $this->bahanProductService->delete($bahanProduct);

        if (!$result['success']) {
            return response()->json([
                'status'  => false,
                'message' => $result['message'],
            ], $result['code']);
        }

        return response()->json([
            'status'  => true,
            'message' => $result['message'],
        ]);
    }
}