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

    public function show(BahanProduct $bahanProduct): JsonResponse
    {
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

    public function update(UpdateBahanProductRequest $request, BahanProduct $bahanProduct): JsonResponse
    {
        $updatedBahan = $this->bahanProductService->update($bahanProduct, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui.',
            'data'    => $updatedBahan,
        ]);
    }

    public function destroy(BahanProduct $bahanProduct): JsonResponse
    {
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