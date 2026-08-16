<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Distributor\StoreDistributorRequest;
use App\Http\Requests\Distributor\UpdateDistributorRequest;
use App\Http\Resources\DistributorResource;
use App\Models\Distributor;
use App\Services\Distributor\DistributorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DistributorController extends Controller
{
    public function __construct(
        protected DistributorService $distributorService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->distributorService->getList(
                search: $request->input('search'),
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => DistributorResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Distributor index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dropdown(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->distributorService->getForDropdown(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Distributor dropdown error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data dropdown distributor.',
            ], 500);
        }
    }

    public function show(Distributor $distributor): JsonResponse
    {
        try {
            $detail = $this->distributorService->getDetail($distributor->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Distributor tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new DistributorResource($distributor),
            ]);
        } catch (\Throwable $e) {
            Log::error('Distributor show error', ['id' => $distributor->id, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail distributor.',
            ], 500);
        }
    }

    public function store(StoreDistributorRequest $request): JsonResponse
    {
        try {
            $distributor = $this->distributorService->create($request->validated());

            $this->distributorService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Distributor berhasil dibuat.',
                'data' => new DistributorResource($distributor),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Distributor store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateDistributorRequest $request, Distributor $distributor): JsonResponse
    {
        try {
            $updated = $this->distributorService->update($distributor, $request->validated());

            $this->distributorService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Distributor berhasil diperbarui.',
                'data' => new DistributorResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('Distributor update error', [
                'id' => $distributor->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Distributor $distributor): JsonResponse
    {
        try {
            $result = $this->distributorService->delete($distributor);

            if ($result['success']) {
                $this->distributorService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('Distributor destroy error', [
                'id' => $distributor->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus distributor.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}