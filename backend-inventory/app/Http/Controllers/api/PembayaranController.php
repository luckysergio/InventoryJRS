<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pembayaran\StorePembayaranRequest;
use App\Http\Requests\Pembayaran\UpdatePembayaranRequest;
use App\Models\Pembayaran;
use App\Services\Pembayaran\PembayaranService;
use Illuminate\Http\JsonResponse;

class PembayaranController extends Controller
{
    public function __construct(
        protected PembayaranService $pembayaranService
    ) {}

    public function index(): JsonResponse
    {
        $pembayarans = $this->pembayaranService->getList();

        return response()->json([
            'status' => true,
            'data'   => $pembayarans,
        ]);
    }

    public function store(StorePembayaranRequest $request): JsonResponse
    {
        try {
            $pembayaran = $this->pembayaranService->create($request->validated());

            return response()->json([
                'status'  => true,
                'message' => 'Pembayaran berhasil ditambahkan',
                'data'    => $pembayaran->load('transaksiDetail'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(string|int $id): JsonResponse
    {
        $pembayaran = Pembayaran::with([
            'transaksiDetail.transaksi.customer',
            'transaksiDetail.product'
        ])->find((int) $id);

        if (!$pembayaran) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        return response()->json(['status' => true, 'data' => $pembayaran]);
    }

    public function update(UpdatePembayaranRequest $request, string|int $id): JsonResponse
    {
        $pembayaran = Pembayaran::find((int) $id);

        if (!$pembayaran) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        try {
            $updatedPembayaran = $this->pembayaranService->update($pembayaran, $request->validated());

            return response()->json([
                'status'  => true,
                'message' => 'Pembayaran berhasil diupdate',
                'data'    => $updatedPembayaran,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(string|int $id): JsonResponse
    {
        $pembayaran = Pembayaran::find((int) $id);

        if (!$pembayaran) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $result = $this->pembayaranService->delete($pembayaran);

        return response()->json([
            'status'  => true,
            'message' => $result['message'],
        ]);
    }
}