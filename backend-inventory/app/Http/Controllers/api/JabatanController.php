<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Jabatan\StoreJabatanRequest;
use App\Http\Requests\Jabatan\UpdateJabatanRequest;
use App\Http\Resources\JabatanResource;
use App\Models\Jabatan;
use App\Services\Jabatan\JabatanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JabatanController extends Controller
{
    public function __construct(
        protected JabatanService $jabatanService
    ) {
    }

    public function index(Request $request): JsonResponse
{
    try {
        $search = $request->input('search');
        $withCount = $request->boolean('with_count', true);
        $perPage = $request->input('per_page') ? (int) $request->input('per_page') : null;
        $page = (int) $request->input('page', 1);

        $result = $this->jabatanService->getList(
            search: $search,
            withCount: $withCount,
            perPage: $perPage,
            page: $page
        );

        return response()->json([
            'status' => true,
            'data' => JabatanResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => false,
            'message' => 'Gagal memuat data jabatan.',
            'error' => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }
}

    public function dropdown(): JsonResponse
    {
        try {
            $jabatans = $this->jabatanService->getForDropdown();

            return response()->json([
                'status' => true,
                'data' => $jabatans->map(fn($j) => [
                    'value' => $j->id,
                    'label' => $j->nama,
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
            $stats = $this->jabatanService->getStatistics();

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

    public function show(Jabatan $jabatan): JsonResponse
    {
        try {
            $detail = $this->jabatanService->getDetail($jabatan->id);

            if (!$detail) {
                return response()->json([
                    'status' => false,
                    'message' => 'Jabatan tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => new JabatanResource($detail),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memuat detail jabatan.',
            ], 500);
        }
    }

    public function store(StoreJabatanRequest $request): JsonResponse
    {
        try {
            $jabatan = $this->jabatanService->create($request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Jabatan berhasil dibuat.',
                'data' => new JabatanResource($jabatan),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat jabatan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(UpdateJabatanRequest $request, Jabatan $jabatan): JsonResponse
    {
        try {
            $updatedJabatan = $this->jabatanService->update($jabatan, $request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Jabatan berhasil diperbarui.',
                'data' => new JabatanResource($updatedJabatan),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal memperbarui jabatan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Jabatan $jabatan): JsonResponse
    {
        try {
            $result = $this->jabatanService->delete($jabatan);

            return response()->json([
                'status' => $result['success'],
                'message' => $result['message'],
            ], $result['success'] ? 200 : ($result['code'] ?? 400));
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal menghapus jabatan.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}