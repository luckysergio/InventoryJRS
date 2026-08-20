<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transaksi\StoreTransaksiRequest;
use App\Http\Requests\Transaksi\UpdateTransaksiRequest;
use App\Http\Resources\TransaksiDetailResource;
use App\Http\Resources\TransaksiResource;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Services\Inventory\InventoryService;
use App\Services\Pembayaran\PembayaranService;
use App\Services\ProductMovement\ProductMovementService;
use App\Services\Transaksi\TransaksiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TransaksiController extends Controller
{
    public function __construct(
        protected TransaksiService $transaksiService,
        protected InventoryService $inventoryService,
        protected ProductMovementService $productMovementService,
        protected PembayaranService $pembayaranService
    ) {}

    /**
     * Helper untuk invalidate semua cache terkait
     */
    private function invalidateAll(): void
    {
        $this->transaksiService->invalidateCache();
        $this->inventoryService->invalidateCache();
        $this->productMovementService->invalidateCache();
        $this->pembayaranService->invalidateCache();
    }

    /**
     * GET /api/transaksi
     * Support mode: all | aktif | riwayat | riwayat_all
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $filters = [
                'jenis'       => $request->input('jenis', 'daily'),
                'mode'        => $request->input('mode', 'all'),
                'search'      => $request->input('search'),
                'customer_id' => $request->input('customer_id'),
                'dari'        => $request->input('dari'),
                'sampai'      => $request->input('sampai'),
            ];

            $result = $this->transaksiService->getList($filters, $perPage, $page);

            return response()->json([
                'status' => true,
                'data'   => TransaksiResource::collection($result['data']),
                'meta'   => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Transaksi index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat data transaksi.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /api/transaksi/aktif (shortcut)
     */
    public function aktif(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'aktif']));
    }

    /**
     * GET /api/transaksi/riwayat (shortcut)
     */
    public function riwayat(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'riwayat']));
    }

    /**
     * GET /api/transaksi/riwayat-all (shortcut)
     */
    public function riwayatAll(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'riwayat_all']));
    }

    /**
     * GET /api/transaksi/customer/{customerId}/riwayat (shortcut)
     * ✅ FIXED: Tambahkan type hint int untuk $customerId
     */
    public function riwayatByCustomer(Request $request, int $customerId): JsonResponse
    {
        return $this->index($request->merge([
            'mode'        => 'riwayat',
            'customer_id' => $customerId,
        ]));
    }

    /**
     * POST /api/transaksi
     */
    public function store(StoreTransaksiRequest $request): JsonResponse
    {
        try {
            $transaksi = $this->transaksiService->create($request->validated());

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Transaksi berhasil dibuat.',
                'data'    => new TransaksiResource($transaksi),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Transaksi store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal membuat transaksi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/transaksi/{transaksi}
     */
    public function show(Transaksi $transaksi): JsonResponse
    {
        try {
            $detail = $this->transaksiService->getDetail($transaksi->id);

            if (!$detail) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Transaksi tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => new TransaksiResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('Transaksi show error', [
                'id'    => $transaksi->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail transaksi.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * PUT /api/transaksi/{transaksi}
     */
    public function update(UpdateTransaksiRequest $request, Transaksi $transaksi): JsonResponse
    {
        try {
            $updated = $this->transaksiService->update($transaksi, $request->validated());

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Transaksi berhasil diperbarui.',
                'data'    => new TransaksiResource($updated),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Transaksi update error', [
                'id'    => $transaksi->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal mengupdate transaksi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/transaksi/{transaksi}
     */
    public function destroy(Transaksi $transaksi): JsonResponse
    {
        try {
            $this->transaksiService->delete($transaksi);

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Transaksi berhasil dihapus.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Transaksi destroy error', [
                'id'    => $transaksi->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/transaksi/detail/{detail}/status
     */
    public function updateStatus(Request $request, TransaksiDetail $detail): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status_transaksi_id' => ['required', 'integer', 'exists:status_transaksis,id'],
            ]);

            $updated = $this->transaksiService->updateDetailStatus($detail, $validated['status_transaksi_id']);

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Status detail transaksi berhasil diubah.',
                'data'    => new TransaksiDetailResource($updated),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Transaksi updateStatus error', [
                'detail_id' => $detail->id,
                'error'     => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/transaksi/detail/{detail}/cancel
     */
    public function cancelDetail(TransaksiDetail $detail): JsonResponse
    {
        try {
            $this->transaksiService->cancelDetail($detail);

            $this->invalidateAll();

            return response()->json([
                'status'  => true,
                'message' => 'Detail transaksi berhasil dibatalkan. Stok telah dikembalikan.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Transaksi cancelDetail error', [
                'detail_id' => $detail->id,
                'error'     => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}