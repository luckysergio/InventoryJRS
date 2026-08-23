<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transaksi\StoreTransaksiRequest;
use App\Http\Requests\Transaksi\UpdateTransaksiRequest;
use App\Http\Resources\TransaksiDetailResource;
use App\Http\Resources\TransaksiResource;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Services\Customer\CustomerService;
use App\Services\Dashboard\DashboardService;
use App\Services\Inventory\InventoryService;
use App\Services\Pembayaran\PembayaranService;
use App\Services\ProductMovement\ProductMovementService;
use App\Services\Transaksi\TransaksiService;
use App\Traits\BroadcastsDashboardEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TransaksiController extends Controller
{
    use BroadcastsDashboardEvents;

    public function __construct(
        protected TransaksiService $transaksiService,
        protected InventoryService $inventoryService,
        protected ProductMovementService $productMovementService,
        protected PembayaranService $pembayaranService,
        protected DashboardService $dashboardService,
        protected CustomerService $customerService // ✅ NEW: untuk invalidate cache customer (tagihan)
    ) {}

    /**
     * Invalidate semua cache yang terpengaruh oleh perubahan transaksi.
     * - Transaksi, Inventory, ProductMovement, Pembayaran: data inti
     * - Dashboard: metrics, chart, login stats
     * - Customer: ✅ tagihan/outstanding balance berubah saat transaksi berubah
     */
    private function invalidateAll(): void
    {
        $this->transaksiService->invalidateCache();
        $this->inventoryService->invalidateCache();
        $this->productMovementService->invalidateCache();
        $this->pembayaranService->invalidateCache();
        $this->customerService->invalidateCache(); // ✅ NEW
        $this->invalidateDashboard();
    }

    private function invalidateDashboard(): void
    {
        try {
            $this->dashboardService->invalidateAll();
            Log::info('Dashboard cache invalidated from TransaksiController');
        } catch (\Throwable $e) {
            Log::warning('Failed to invalidate dashboard cache from TransaksiController', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 20), 50);
            $page = max((int) $request->input('page', 1), 1);

            $filters = [
                'jenis'       => $request->input('jenis'),
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

    public function aktif(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'aktif']));
    }

    public function riwayat(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'riwayat']));
    }

    public function riwayatAll(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'riwayat_all']));
    }

    public function riwayatByCustomer(Request $request, int $customerId): JsonResponse
    {
        return $this->index($request->merge([
            'mode'        => 'riwayat',
            'customer_id' => $customerId,
        ]));
    }

    public function store(StoreTransaksiRequest $request): JsonResponse
    {
        try {
            $transaksi = $this->transaksiService->create($request->validated());

            $this->invalidateAll();

            $this->broadcastTransaksiEvent('created', [
                'id' => $transaksi->id,
                'jenis' => $transaksi->jenis_transaksi,
                'total' => $transaksi->total ?? 0,
                'customer_id' => $transaksi->customer_id,
            ]);

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

    public function update(UpdateTransaksiRequest $request, Transaksi $transaksi): JsonResponse
    {
        try {
            $updated = $this->transaksiService->update($transaksi, $request->validated());

            $this->invalidateAll();

            $this->broadcastTransaksiEvent('updated', [
                'id' => $transaksi->id,
                'customer_id' => $transaksi->customer_id,
            ]);

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

    public function destroy(Transaksi $transaksi): JsonResponse
    {
        try {
            $customerId = $transaksi->customer_id;
            $this->transaksiService->delete($transaksi);

            $this->invalidateAll();

            $this->broadcastTransaksiEvent('deleted', [
                'id' => $transaksi->id,
                'customer_id' => $customerId,
            ]);

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

    public function updateStatus(Request $request, TransaksiDetail $detail): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status_transaksi_id' => ['required', 'integer', 'exists:status_transaksis,id'],
            ]);

            $updated = $this->transaksiService->updateDetailStatus($detail, $validated['status_transaksi_id']);

            $this->invalidateAll();

            $this->broadcastTransaksiEvent('status_changed', [
                'detail_id' => $detail->id,
                'new_status' => $validated['status_transaksi_id'],
                'customer_id' => $detail->transaksi?->customer_id,
            ]);

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

    public function cancelDetail(TransaksiDetail $detail): JsonResponse
    {
        try {
            $customerId = $detail->transaksi?->customer_id;
            $this->transaksiService->cancelDetail($detail);

            $this->invalidateAll();

            $this->broadcastTransaksiEvent('detail_cancelled', [
                'detail_id' => $detail->id,
                'customer_id' => $customerId,
            ]);

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