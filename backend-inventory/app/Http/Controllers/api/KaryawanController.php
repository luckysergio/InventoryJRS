<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\Jabatan;
use Illuminate\Http\Request;

class KaryawanController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $karyawans = Karyawan::with('jabatan')
            ->when($search, function ($query) use ($search) {
                $query->whereRaw(
                    'LOWER(nama) LIKE ?',
                    ['%' . strtolower($search) . '%']
                );
            })
            ->orderByRaw('LOWER(nama) ASC')
            ->paginate(10);

        return response()->json([
            'success'   => true,
            'karyawans' => $karyawans,
            'jabatans' => Jabatan::select('id', 'nama')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'no_hp' => 'required|string|max:20',
            'email' => 'required|email|unique:karyawans,email',

            'jabatan_id' => 'nullable|exists:jabatans,id',
            'jabatan_nama' => 'nullable|string|max:255'
        ]);

        $jabatanId = $this->resolveJabatan($request);

        $karyawan = Karyawan::create([
            'nama' => $request->nama,
            'no_hp' => $request->no_hp,
            'email' => $request->email,
            'jabatan_id' => $jabatanId
        ]);

        return response()->json([
            'success' => true,
            'data' => $karyawan->load('jabatan')
        ], 201);
    }

    public function update(Request $request, Karyawan $karyawan)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'no_hp' => 'required|string|max:20',
            'email' => "required|email|unique:karyawans,email,{$karyawan->id}",

            // sama seperti store
            'jabatan_id' => 'nullable|exists:jabatans,id',
            'jabatan_nama' => 'nullable|string|max:255'
        ]);

        $jabatanId = $this->resolveJabatan($request);

        $karyawan->update([
            'nama' => $request->nama,
            'no_hp' => $request->no_hp,
            'email' => $request->email,
            'jabatan_id' => $jabatanId
        ]);

        return response()->json([
            'success' => true,
            'data' => $karyawan->load('jabatan')
        ]);
    }

    public function destroy(Karyawan $karyawan)
    {
        $karyawan->delete();

        return response()->json([
            'success' => true
        ], 204);
    }

    private function resolveJabatan(Request $request): int
    {
        if ($request->filled('jabatan_id')) {
            return $request->jabatan_id;
        }

        if ($request->filled('jabatan_nama')) {
            $jabatan = Jabatan::firstOrCreate(
                ['nama' => $request->jabatan_nama]
            );

            return $jabatan->id;
        }

        abort(422, 'jabatan_id atau jabatan_nama wajib diisi');
    }
}
