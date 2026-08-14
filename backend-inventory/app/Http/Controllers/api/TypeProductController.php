<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TypeProduct\StoreTypeProductRequest;
use App\Http\Requests\TypeProduct\UpdateTypeProductRequest;
use App\Models\TypeProduct;
use App\Services\TypeProduct\TypeProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TypeProductController extends Controller
{
    public function __construct(
        protected TypeProductService $typeProductService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);
        $page = max((int) $request->input('page', 1), 1);

        $data = $this->typeProductService->getList(
            search: $request->input('search'),
            jenisId: $request->input('jenis_id') ? (int) $request->input('jenis_id') : null,
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function show(TypeProduct $typeProduct): JsonResponse
    {
        $detail = $this->typeProductService->getDetail($typeProduct->id);

        return response()->json([
            'status' => true,
            'data'   => $detail,
        ]);
    }

    public function store(StoreTypeProductRequest $request): JsonResponse
    {
        $type = $this->typeProductService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan.',
            'data'    => $type,
        ], 201);
    }

    public function update(UpdateTypeProductRequest $request, TypeProduct $typeProduct): JsonResponse
    {
        $updatedType = $this->typeProductService->update($typeProduct, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui.',
            'data'    => $updatedType,
        ]);
    }

    public function destroy(TypeProduct $typeProduct): JsonResponse
    {
        $result = $this->typeProductService->delete($typeProduct);

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