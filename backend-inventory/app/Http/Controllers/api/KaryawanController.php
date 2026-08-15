<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Karyawan\StoreKaryawanRequest;
use App\Http\Requests\Karyawan\UpdateKaryawanRequest;
use App\Http\Resources\KaryawanResource;
use App\Models\Karyawan;
use App\Services\Karyawan\KaryawanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KaryawanController extends Controller
{
    public function __construct(
        protected KaryawanService $karyawanService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min((int) $request->input('per_page', 10), 100);
            $page = max((int) $request->input('page', 1), 1);
            $search = $request->input('search');
            $jabatanId = $request->input('jabatan_id')
                ? (int) $request->input('jabatan_id')
                : null;

            $result = $this->karyawanService->getList(
                search: $search,
                jabatanId: $jabatanId,
                perPage: $perPage,
                page: $page
            );

            return response()->json([
                'status' => true,
                'data' => KaryawanResource::collection($result['data']),
                'meta' => $result['meta'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat data karyawan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function dropdown(): JsonResponse
    {
        try {
            $karyawans = $this->karyawanService->getForDropdown();

            return response()->json([
                'status' => true,
                'data' => $karyawans->map(fn($k) => [
                    'value' => $k->id,
                    'label' => $k->nama . ($k->no_hp ? " ({$k->no_hp})" : ''),
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
            $stats = $this->karyawanService->getStatistics();

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

    public function show(Karyawan $karyawan): JsonResponse
    {
        try {
            $detail = $this->karyawanService->getDetail($karyawan->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Karyawan tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new KaryawanResource($detail),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail karyawan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StoreKaryawanRequest $request): JsonResponse
    {
        try {
            $karyawan = $this->karyawanService->create($request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Karyawan berhasil ditambahkan.',
                'data' => new KaryawanResource($karyawan),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal menambahkan karyawan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateKaryawanRequest $request, Karyawan $karyawan): JsonResponse
    {
        try {
            $updatedKaryawan = $this->karyawanService->update($karyawan, $request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Karyawan berhasil diperbarui.',
                'data' => new KaryawanResource($updatedKaryawan),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui karyawan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Karyawan $karyawan): JsonResponse
    {
        try {
            $result = $this->karyawanService->delete($karyawan);

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus karyawan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}