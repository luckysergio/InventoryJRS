<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BahanProduct\StoreBahanProductRequest;
use App\Http\Requests\BahanProduct\UpdateBahanProductRequest;
use App\Http\Resources\BahanProductResource;
use App\Models\BahanProduct;
use App\Services\BahanProduct\BahanProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BahanProductController extends Controller
{
    public function __construct(
        protected BahanProductService $bahanProductService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->input('search');
            $withCount = $request->boolean('with_count', true);
            $perPage = $request->input('per_page') ? (int) $request->input('per_page') : null;
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->bahanProductService->getList(
                search: $search,
                withCount: $withCount,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => BahanProductResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data bahan product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dropdown(): JsonResponse
    {
        try {
            $bahanProducts = $this->bahanProductService->getForDropdown();

            return response()->json([
                'status' => true,
                'data' => $bahanProducts->map(fn($b) => [
                    'value' => $b->id,
                    'label' => $b->nama,
                ]),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown.',
            ], 500);
        }
    }

    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->bahanProductService->getStatistics();

            return response()->json([
                'status' => true,
                'data' => $stats,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat statistik.',
            ], 500);
        }
    }

    public function show(BahanProduct $bahanProduct): JsonResponse
    {
        try {
            $detail = $this->bahanProductService->getDetail($bahanProduct->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bahan product tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new BahanProductResource($detail),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail bahan product.',
            ], 500);
        }
    }

    public function store(StoreBahanProductRequest $request): JsonResponse
    {
        try {
            $bahan = $this->bahanProductService->create($request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Bahan product berhasil dibuat.',
                'data' => new BahanProductResource($bahan),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat bahan product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateBahanProductRequest $request, BahanProduct $bahanProduct): JsonResponse
    {
        try {
            $updated = $this->bahanProductService->update($bahanProduct, $request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Bahan product berhasil diperbarui.',
                'data' => new BahanProductResource($updated),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui bahan product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(BahanProduct $bahanProduct): JsonResponse
    {
        try {
            $result = $this->bahanProductService->delete($bahanProduct);

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus bahan product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}