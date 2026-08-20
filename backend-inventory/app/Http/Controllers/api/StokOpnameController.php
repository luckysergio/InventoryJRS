<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StokOpname\StoreDetailStokOpnameRequest;
use App\Http\Requests\StokOpname\StoreStokOpnameRequest;
use App\Http\Resources\DetailStokOpnameResource;
use App\Http\Resources\StokOpnameResource;
use App\Models\StokOpname;
use App\Services\Inventory\InventoryService;
use App\Services\ProductMovement\ProductMovementService;
use App\Services\StokOpname\StokOpnameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StokOpnameController extends Controller
{
    public function __construct(
        protected StokOpnameService $stokOpnameService,
        protected InventoryService $inventoryService,
        protected ProductMovementService $productMovementService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->stokOpnameService->getList(
                status: $request->input('status'),
                dari: $request->input('dari'),
                sampai: $request->input('sampai'),
                excludeDraft: $request->boolean('exclude_draft'),  // ✅ BARU
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => StokOpnameResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('StokOpname index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data stok opname.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StoreStokOpnameRequest $request): JsonResponse
    {
        try {
            $stokOpname = $this->stokOpnameService->create($request->validated());

            $this->stokOpnameService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Stok opname berhasil dibuat.',
                'data' => new StokOpnameResource($stokOpname),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('StokOpname store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat stok opname.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(StokOpname $stokOpname): JsonResponse
    {
        try {
            $detail = $this->stokOpnameService->getDetail($stokOpname->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Stok opname tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new StokOpnameResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('StokOpname show error', [
                'id' => $stokOpname->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail stok opname.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function storeDetail(StoreDetailStokOpnameRequest $request, StokOpname $stokOpname): JsonResponse
    {
        try {
            $detail = $this->stokOpnameService->updateDetail($stokOpname, $request->validated());

            $this->stokOpnameService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Detail stok opname berhasil diperbarui.',
                'data' => new DetailStokOpnameResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('StokOpname storeDetail error', [
                'id' => $stokOpname->id,
                'error' => $e->getMessage(),
            ]);

            $statusCode = str_contains($e->getMessage(), 'dikunci') ? 422 : 500;

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], $statusCode);
        }
    }

    public function selesai(StokOpname $stokOpname): JsonResponse
    {
        try {
            $this->stokOpnameService->selesai($stokOpname);

            $this->stokOpnameService->invalidateCache();
            $this->inventoryService->invalidateCache();
            $this->productMovementService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Stok opname berhasil diselesaikan dan stok disesuaikan.',
            ]);
        } catch (\Throwable $e) {
            Log::error('StokOpname selesai error', [
                'id' => $stokOpname->id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 422);
        }
    }

    public function batalkan(StokOpname $stokOpname): JsonResponse
    {
        try {
            $this->stokOpnameService->batalkan($stokOpname);

            $this->stokOpnameService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Stok opname berhasil dibatalkan.',
            ]);
        } catch (\Throwable $e) {
            Log::error('StokOpname batalkan error', [
                'id' => $stokOpname->id,
                'error' => $e->getMessage(),
            ]);

            $statusCode = str_contains($e->getMessage(), 'draft') ? 422 : 500;

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], $statusCode);
        }
    }
}