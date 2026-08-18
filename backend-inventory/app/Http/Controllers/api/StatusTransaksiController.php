<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StatusTransaksi\StoreStatusTransaksiRequest;
use App\Http\Requests\StatusTransaksi\UpdateStatusTransaksiRequest;
use App\Http\Resources\StatusTransaksiResource;
use App\Models\StatusTransaksi;
use App\Services\StatusTransaksi\StatusTransaksiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class StatusTransaksiController extends Controller
{
    public function __construct(
        protected StatusTransaksiService $statusTransaksiService
    ) {}

    public function index(): JsonResponse
    {
        try {
            return response()->json([
                'status' => true,
                'data' => $this->statusTransaksiService->getAll(),
            ]);
        } catch (\Throwable $e) {
            Log::error('StatusTransaksi index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data status transaksi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StoreStatusTransaksiRequest $request): JsonResponse
    {
        try {
            $status = $this->statusTransaksiService->create($request->validated());

            $this->statusTransaksiService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Status transaksi berhasil ditambahkan.',
                'data' => new StatusTransaksiResource($status),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('StatusTransaksi store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menambahkan status transaksi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateStatusTransaksiRequest $request, StatusTransaksi $statusTransaksi): JsonResponse
    {
        try {
            $updated = $this->statusTransaksiService->update($statusTransaksi, $request->validated());

            $this->statusTransaksiService->invalidateCache();

            return response()->json([
                'status' => true,
                'message' => 'Status transaksi berhasil diperbarui.',
                'data' => new StatusTransaksiResource($updated),
            ]);
        } catch (\Throwable $e) {
            Log::error('StatusTransaksi update error', [
                'id' => $statusTransaksi->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui status transaksi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(StatusTransaksi $statusTransaksi): JsonResponse
    {
        try {
            $result = $this->statusTransaksiService->delete($statusTransaksi);

            if ($result['success']) {
                $this->statusTransaksiService->invalidateCache();
            }

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            Log::error('StatusTransaksi destroy error', [
                'id' => $statusTransaksi->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus status transaksi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}