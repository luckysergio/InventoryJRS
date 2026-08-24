<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JenisProduct\StoreJenisProductRequest;
use App\Http\Requests\JenisProduct\UpdateJenisProductRequest;
use App\Http\Resources\JenisProductResource;
use App\Models\JenisProduct;
use App\Services\JenisProduct\JenisProductService;
use App\Services\TypeProduct\TypeProductService;
use App\Services\Product\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class JenisProductController extends Controller
{
    public function __construct(
        protected JenisProductService $jenisProductService,
        protected TypeProductService $typeProductService,
        protected ProductService $productService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->input('search');
            $withCount = $request->boolean('with_count', true);
            $perPage = $request->input('per_page') ? (int) $request->input('per_page') : null;
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->jenisProductService->getList(
                search: $search,
                withCount: $withCount,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => JenisProductResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('JenisProduct index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data jenis produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dropdown(): JsonResponse
    {
        try {
            $jenisProducts = $this->jenisProductService->getForDropdown();

            return response()->json([
                'status' => true,
                'data' => $jenisProducts->map(fn($j) => [
                    'value' => $j->id,
                    'label' => $j->nama,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('JenisProduct dropdown error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown.',
            ], 500);
        }
    }

    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->jenisProductService->getStatistics();

            return response()->json([
                'status' => true,
                'data' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('JenisProduct statistics error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat statistik.',
            ], 500);
        }
    }

    public function show(JenisProduct $jenisProduct): JsonResponse
    {
        try {
            $detail = $this->jenisProductService->getDetail($jenisProduct->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Jenis produk tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new JenisProductResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('JenisProduct show error', [
                'id' => $jenisProduct->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail jenis produk.',
            ], 500);
        }
    }

    public function store(StoreJenisProductRequest $request): JsonResponse
    {
        try {
            $jenis = $this->jenisProductService->create($request->validated());

            // ✅ CROSS-INVALIDATION: Jenis → Type + Product
            // Karena cache Type & Product bisa include relasi jenis (via with/join)
            $this->typeProductService->invalidateCache();
            $this->productService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Jenis produk berhasil dibuat.',
                'data' => new JenisProductResource($jenis),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('JenisProduct store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat jenis produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateJenisProductRequest $request, JenisProduct $jenisProduct): JsonResponse
    {
        try {
            $updated = $this->jenisProductService->update($jenisProduct, $request->validated());

            // ✅ CROSS-INVALIDATION: Jenis berubah → Type & Product harus refresh
            // Karena `jenis.nama` di-embed di cache Type dan Product
            $this->typeProductService->invalidateCache();
            $this->productService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Jenis produk berhasil diperbarui.',
                'data' => new JenisProductResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('JenisProduct update error', [
                'id' => $jenisProduct->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui jenis produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(JenisProduct $jenisProduct): JsonResponse
    {
        try {
            $result = $this->jenisProductService->delete($jenisProduct);

            // ✅ CROSS-INVALIDATION hanya jika delete sukses
            if ($result['success']) {
                $this->typeProductService->invalidateCache();
                $this->productService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('JenisProduct destroy error', [
                'id' => $jenisProduct->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus jenis produk.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function master(): JsonResponse
    {
        return $this->dropdown();
    }
}