<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pesanan\StorePesananRequest;
use App\Http\Requests\Pesanan\UpdatePesananRequest;
use App\Http\Resources\PesananTransaksiDetailResource;
use App\Http\Resources\PesananTransaksiResource;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Services\Dashboard\DashboardService;
use App\Services\Production\ProductionService;
use App\Services\Transaksi\PesananTransaksiService;
use App\Traits\BroadcastsDashboardEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PesananTransaksiController extends Controller
{
    use BroadcastsDashboardEvents;

    public function __construct(
        private PesananTransaksiService $service,
        private ProductionService $productionService,
        private DashboardService $dashboardService
    ) {}

    private function invalidateAll(): void
    {
        $this->invalidateProductionCache();
        $this->invalidateDashboard();
    }

    private function invalidateProductionCache(): void
    {
        try {
            $this->productionService->invalidateCache();
            Log::info('Production cache invalidated from PesananTransaksiController');
        } catch (\Throwable $e) {
            Log::warning('Failed to invalidate production cache', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function invalidateDashboard(): void
    {
        try {
            $this->dashboardService->invalidateAll();
            Log::info('Dashboard cache invalidated from PesananTransaksiController');
        } catch (\Throwable $e) {
            Log::warning('Failed to invalidate dashboard cache from PesananTransaksiController', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $result = $this->service->getList(
                filters: $request->only(['mode', 'search', 'customer_id', 'dari', 'sampai']),
                perPage: min((int) $request->get('per_page', 20), 100),
                page: max((int) $request->get('page', 1), 1),
            );

            return response()->json([
                'status' => true,
                'data'   => PesananTransaksiResource::collection($result['data']),
                'meta'   => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Pesanan index error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat data pesanan.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function aktif(Request $request): JsonResponse
    {
        return $this->index($request->merge(['mode' => 'aktif']));
    }

    public function show(Transaksi $pesanan): JsonResponse
    {
        try {
            if ($pesanan->jenis_transaksi !== 'pesanan') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Pesanan tidak ditemukan.',
                ], 404);
            }

            $detail = $this->service->getDetail($pesanan->id);

            if (!$detail) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Pesanan tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data'   => new PesananTransaksiResource($detail),
            ]);
        } catch (\Throwable $e) {
            Log::error('Pesanan show error', [
                'id' => $pesanan->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat detail pesanan.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function printNota(Transaksi $pesanan)
    {
        if ($pesanan->jenis_transaksi !== 'pesanan') {
            return response()->json([
                'status'  => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        $detail = $this->service->getDetail($pesanan->id);

        if (!$detail) {
            return response()->json([
                'status'  => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        return response()->view('print.nota-pesanan', [
            'transaksi' => $detail,
        ]);
    }

    public function store(StorePesananRequest $request): JsonResponse
    {
        try {
            $transaksi = $this->service->create($request->validated());

            $this->invalidateAll();

            // ✅ Broadcast event
            $this->broadcastPesananEvent('created', [
                'id' => $transaksi->id,
                'customer_id' => $transaksi->customer_id,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data'    => new PesananTransaksiResource($transaksi),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Pesanan store error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal membuat pesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(UpdatePesananRequest $request, Transaksi $pesanan): JsonResponse
    {
        if ($pesanan->jenis_transaksi !== 'pesanan') {
            return response()->json([
                'status'  => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        try {
            $updated = $this->service->update($pesanan, $request->validated());

            $this->invalidateAll();

            // ✅ Broadcast event
            $this->broadcastPesananEvent('updated', [
                'id' => $pesanan->id,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Pesanan berhasil diperbarui.',
                'data'    => new PesananTransaksiResource($updated),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Pesanan update error', [
                'id' => $pesanan->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memperbarui pesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Transaksi $pesanan): JsonResponse
    {
        if ($pesanan->jenis_transaksi !== 'pesanan') {
            return response()->json([
                'status'  => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        try {
            $this->service->delete($pesanan);

            $this->invalidateAll();

            // ✅ Broadcast event
            $this->broadcastPesananEvent('deleted', [
                'id' => $pesanan->id,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Pesanan berhasil dihapus.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Pesanan destroy error', [
                'id' => $pesanan->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal menghapus pesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateStatus(Request $request, TransaksiDetail $detail): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status_transaksi_id' => ['required', 'integer', 'exists:status_transaksis,id'],
            ]);

            if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Detail pesanan tidak ditemukan.',
                ], 404);
            }

            $updated = $this->service->updateDetailStatus($detail, $validated['status_transaksi_id']);

            $this->invalidateAll();

            // ✅ Broadcast event
            $this->broadcastPesananEvent('status_changed', [
                'detail_id' => $detail->id,
                'new_status' => $validated['status_transaksi_id'],
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Status detail pesanan berhasil diubah.',
                'data'    => new PesananTransaksiDetailResource($updated),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Pesanan updateStatus error', [
                'detail_id' => $detail->id,
                'error' => $e->getMessage(),
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
            if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Detail pesanan tidak ditemukan.',
                ], 404);
            }

            $this->service->cancelDetail($detail);

            $this->invalidateAll();

            // ✅ Broadcast event
            $this->broadcastPesananEvent('detail_cancelled', [
                'detail_id' => $detail->id,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Detail pesanan berhasil dibatalkan.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Pesanan cancelDetail error', [
                'detail_id' => $detail->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function selesai(TransaksiDetail $detail): JsonResponse
    {
        try {
            if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
                return response()->json([
                    'status'  => false,
                    'message' => 'Detail pesanan tidak ditemukan.',
                ], 404);
            }

            $this->service->completeDetail($detail);

            $this->invalidateAll();

            // ✅ Broadcast event
            $this->broadcastPesananEvent('completed', [
                'detail_id' => $detail->id,
            ]);

            return response()->json([
                'status'  => true,
                'message' => 'Detail pesanan berhasil diselesaikan.',
            ]);
        } catch (ValidationException $e) {
            $errorMessage = collect($e->errors())->flatten()->first() ?? 'Validasi gagal';

            return response()->json([
                'status'  => false,
                'message' => $errorMessage,
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Pesanan selesai error', [
                'detail_id' => $detail->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}