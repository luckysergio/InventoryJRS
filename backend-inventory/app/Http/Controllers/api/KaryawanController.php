<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Karyawan\StoreKaryawanRequest;
use App\Http\Requests\Karyawan\UpdateKaryawanRequest;
use App\Models\Karyawan;
use App\Models\Jabatan;
use App\Services\Karyawan\KaryawanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KaryawanController extends Controller
{
    public function __construct(
        protected KaryawanService $karyawanService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 10), 100);
        $page = max((int) $request->input('page', 1), 1);

        $karyawans = $this->karyawanService->getList(
            search: $request->input('search'),
            jabatanId: $request->input('jabatan_id'),
            perPage: $perPage,
            page: $page
        );

        // Catatan: Frontend sebaiknya menggunakan hook `useJabatans()` yang sudah kita buat
        // untuk mengambil data ini, agar tidak perlu dikirim ulang di setiap response karyawan.
        // Namun, ini dibiarkan agar tidak merusak frontend yang sudah ada.
        $jabatans = Jabatan::select('id', 'nama')->orderBy('nama', 'asc')->get();

        return response()->json([
            'status'   => true,
            'data'     => $karyawans,
            'jabatans' => $jabatans,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $karyawan = $this->karyawanService->getDetail($id);

        if (!$karyawan) {
            return response()->json([
                'status'  => false,
                'message' => 'Karyawan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $karyawan,
        ]);
    }

    public function store(StoreKaryawanRequest $request): JsonResponse
    {
        $karyawan = $this->karyawanService->create($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Karyawan berhasil ditambahkan.',
            'data'    => $karyawan,
        ], 201);
    }

    public function update(UpdateKaryawanRequest $request, Karyawan $karyawan): JsonResponse
    {
        $updatedKaryawan = $this->karyawanService->update($karyawan, $request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Karyawan berhasil diperbarui.',
            'data'    => $updatedKaryawan,
        ]);
    }

    public function destroy(Karyawan $karyawan): JsonResponse
    {
        $result = $this->karyawanService->delete($karyawan);

        return response()->json([
            'status'  => $result['success'],
            'message' => $result['message'],
        ]);
    }
}