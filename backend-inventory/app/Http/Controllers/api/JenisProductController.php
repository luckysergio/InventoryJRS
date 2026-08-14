<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JenisProduct\StoreJenisProductRequest;
use App\Http\Requests\JenisProduct\UpdateJenisProductRequest;
use App\Models\JenisProduct;
use App\Services\JenisProduct\JenisProductService;
use Illuminate\Http\JsonResponse;

class JenisProductController extends Controller
{
    public function __construct(
        protected JenisProductService $jenisProductService
    ) {}

    public function index(): JsonResponse
    {
        // Mengembalikan list dengan counts (menggantikan fungsi master() yang redundan)
        $data = $this->jenisProductService->getList(withCounts: true);

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function show(JenisProduct $jenisProduct): JsonResponse
    {
        $detail = $this->jenisProductService->getDetail($jenisProduct->id);

        return response()->json([
            'status' => true,
            'data'   => $detail,
        ]);
    }

    public function store(StoreJenisProductRequest $request): JsonResponse
    {
        $jenis = $this->jenisProductService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan.',
            'data'    => $jenis,
        ], 201);
    }

    public function update(UpdateJenisProductRequest $request, JenisProduct $jenisProduct): JsonResponse
    {
        $updatedJenis = $this->jenisProductService->update($jenisProduct, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui.',
            'data'    => $updatedJenis,
        ]);
    }

    public function destroy(JenisProduct $jenisProduct): JsonResponse
    {
        $result = $this->jenisProductService->delete($jenisProduct);

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