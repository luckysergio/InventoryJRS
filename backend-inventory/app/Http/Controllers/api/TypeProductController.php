<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TypeProduct\StoreTypeProductRequest;
use App\Http\Requests\TypeProduct\UpdateTypeProductRequest;
use App\Http\Resources\TypeProductResource;
use App\Models\TypeProduct;
use App\Services\TypeProduct\TypeProductService;
use App\Services\JenisProduct\JenisProductService;
use App\Services\Product\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TypeProductController extends Controller
{
    public function __construct(
        protected TypeProductService $typeProductService,
        protected JenisProductService $jenisProductService,
        protected ProductService $productService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->input('search');
            $jenisId = $request->input('jenis_id')
                ? (int) $request->input('jenis_id')
                : null;
            $perPage = min((int) $request->input('per_page', 20), 100);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->typeProductService->getList(
                search: $search,
                jenisId: $jenisId,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => TypeProductResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('TypeProduct index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data type product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dropdown(Request $request): JsonResponse
    {
        try {
            $jenisId = $request->input('jenis_id')
                ? (int) $request->input('jenis_id')
                : null;

            $types = $this->typeProductService->getForDropdown($jenisId);

            return response()->json([
                'status' => true,
                'data' => $types->map(fn($t) => [
                    'value' => $t->id,
                    'label' => $t->nama,
                    'jenis_id' => $t->jenis_id,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('TypeProduct dropdown error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown.',
            ], 500);
        }
    }

    public function getByJenis(int $jenisId): JsonResponse
    {
        try {
            $types = $this->typeProductService->getByJenis($jenisId);

            return response()->json([
                'status' => true,
                'data' => $types->map(fn($t) => [
                    'value' => $t->id,
                    'label' => $t->nama,
                    'jenis_id' => $t->jenis_id,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('TypeProduct getByJenis error', [
                'jenisId' => $jenisId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data type product.',
            ], 500);
        }
    }

    public function master(Request $request): JsonResponse
    {
        return $this->dropdown($request);
    }

    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->typeProductService->getStatistics();

            return response()->json([
                'status' => true,
                'data' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('TypeProduct statistics error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat statistik.',
            ], 500);
        }
    }

    public function show(TypeProduct $typeProduct): JsonResponse
    {
        try {
            $detail = $this->typeProductService->getDetail($typeProduct->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Type product tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new TypeProductResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('TypeProduct show error', [
                'id' => $typeProduct->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail type product.',
            ], 500);
        }
    }

    public function store(StoreTypeProductRequest $request): JsonResponse
    {
        try {
            $type = $this->typeProductService->create($request->validated());

            $this->jenisProductService->invalidateCache();
            $this->productService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Type product berhasil dibuat.',
                'data' => new TypeProductResource($type),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('TypeProduct store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat type product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateTypeProductRequest $request, TypeProduct $typeProduct): JsonResponse
    {
        try {
            $updated = $this->typeProductService->update($typeProduct, $request->validated());

            $this->jenisProductService->invalidateCache();
            $this->productService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Type product berhasil diperbarui.',
                'data' => new TypeProductResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('TypeProduct update error', [
                'id' => $typeProduct->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui type product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(TypeProduct $typeProduct): JsonResponse
    {
        try {
            $result = $this->typeProductService->delete($typeProduct);

            if ($result['success']) {
                $this->jenisProductService->invalidateCache();
                $this->productService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('TypeProduct destroy error', [
                'id' => $typeProduct->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus type product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}