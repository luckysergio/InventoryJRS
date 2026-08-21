<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pembayaran\StorePembayaranRequest;
use App\Http\Requests\Pembayaran\UpdatePembayaranRequest;
use App\Http\Resources\PembayaranResource;
use App\Models\Pembayaran;
use App\Services\Customer\CustomerService;
use App\Services\Pembayaran\PembayaranService;
use App\Services\Transaksi\PesananTransaksiService;
use App\Services\Transaksi\TransaksiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PembayaranController extends Controller
{
    public function __construct(
        protected PembayaranService $pembayaranService,
        protected TransaksiService $transaksiService,
        protected PesananTransaksiService $pesananService,
        protected CustomerService $customerService
    ) {}

    private function invalidateAll(): void
    {
        $this->pembayaranService->invalidateCache();
        $this->transaksiService->invalidateCache();
        $this->pesananService->invalidateCache();
        $this->customerService->invalidateCache();

        Log::info('All caches invalidated after pembayaran mutation');
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $result = $this->pembayaranService->getList(
                search: $request->input('search'),
                dari: $request->input('dari'),
                sampai: $request->input('sampai'),
                transaksiId: $request->input('transaksi_id') ? (int) $request->input('transaksi_id') : null,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data'   => PembayaranResource::collection($result['data']),
                'meta'   => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Pembayaran index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat data pembayaran.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StorePembayaranRequest $request): JsonResponse
    {
        try {
            $pembayaran = $this->pembayaranService->create($request->validated());

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Pembayaran berhasil ditambahkan.',
                'data'    => new PembayaranResource($pembayaran),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Pembayaran store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(Pembayaran $pembayaran): JsonResponse
    {
        try {
            $detail = $this->pembayaranService->getDetail($pembayaran->id);

            if (!$detail) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Pembayaran tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => new PembayaranResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('Pembayaran show error', [
                'id'    => $pembayaran->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail pembayaran.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdatePembayaranRequest $request, Pembayaran $pembayaran): JsonResponse
    {
        try {
            $updatedPembayaran = $this->pembayaranService->update($pembayaran, $request->validated());

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Pembayaran berhasil diperbarui.',
                'data'    => new PembayaranResource($updatedPembayaran),
            ]);
        } catch (\Throwable $e) {
            Log::error('Pembayaran update error', [
                'id'    => $pembayaran->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(Pembayaran $pembayaran): JsonResponse
    {
        try {
            $this->pembayaranService->delete($pembayaran);

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Pembayaran berhasil dihapus.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Pembayaran destroy error', [
                'id'    => $pembayaran->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}