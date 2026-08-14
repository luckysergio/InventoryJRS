<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Jabatan\StoreJabatanRequest;
use App\Http\Requests\Jabatan\UpdateJabatanRequest;
use App\Models\Jabatan;
use App\Services\Jabatan\JabatanService;
use Illuminate\Http\JsonResponse;

class JabatanController extends Controller
{
    public function __construct(
        protected JabatanService $jabatanService
    ) {}

    public function index(): JsonResponse
    {
        // ✅ Default withCount = true agar frontend tahu jumlah karyawan per jabatan
        $jabatans = $this->jabatanService->getList(withCount: true);

        return response()->json([
            'status' => true,
            'data'   => $jabatans,
        ]);
    }

    /**
     * ✅ Route Model Binding (Jabatan $jabatan) menjamin data ada.
     * Jika tidak ada, Laravel otomatis return 404. Tidak perlu cek manual.
     */
    public function show(Jabatan $jabatan): JsonResponse
    {
        $detail = $this->jabatanService->getDetail($jabatan->id);

        return response()->json([
            'status' => true,
            'data'   => $detail,
        ]);
    }

    public function store(StoreJabatanRequest $request): JsonResponse
    {
        $jabatan = $this->jabatanService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Jabatan berhasil dibuat.',
            'data'    => $jabatan,
        ], 201);
    }

    public function update(UpdateJabatanRequest $request, Jabatan $jabatan): JsonResponse
    {
        $updatedJabatan = $this->jabatanService->update($jabatan, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Jabatan berhasil diperbarui.',
            'data'    => $updatedJabatan,
        ]);
    }

    public function destroy(Jabatan $jabatan): JsonResponse
    {
        $result = $this->jabatanService->delete($jabatan);

        if (!$result['success']) {
            return response()->json([
                'status'  => false,
                'message' => $result['message'],
            ], $result['code']);
        }

        return response()->json([
            'status'  => true,
            'message' => $result['message'],
        ]);
    }
}