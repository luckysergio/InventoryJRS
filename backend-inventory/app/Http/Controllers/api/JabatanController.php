<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JabatanController extends Controller
{
    public function index()
    {
        $jabatans = Jabatan::orderByRaw('LOWER(nama) ASC')->get();

        return response()->json([
            'status' => true,
            'data'   => $jabatans
        ]);
    }

    public function show(Jabatan $jabatan)
    {
        return response()->json([
            'status' => true,
            'data'   => $jabatan
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => [
                'required',
                'string',
                'max:100',
                'unique:jabatans,nama',
                'regex:/^[A-Z\s]+$/'
            ]
        ], [
            'nama.regex'  => 'Nama jabatan harus menggunakan HURUF KAPITAL semua',
            'nama.unique' => 'Nama jabatan sudah ada'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $jabatan = Jabatan::create([
            'nama' => trim($request->nama)
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Jabatan berhasil dibuat',
            'data'    => $jabatan
        ], 201);
    }

    public function update(Request $request, Jabatan $jabatan)
    {
        $validator = Validator::make($request->all(), [
            'nama' => [
                'required',
                'string',
                'max:100',
                'unique:jabatans,nama,' . $jabatan->id,
                'regex:/^[A-Z\s]+$/'
            ]
        ], [
            'nama.regex'  => 'Nama jabatan harus menggunakan HURUF KAPITAL semua',
            'nama.unique' => 'Nama jabatan sudah ada'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $jabatan->update([
            'nama' => trim($request->nama)
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Jabatan berhasil diperbarui',
            'data'    => $jabatan
        ]);
    }

    public function destroy(Jabatan $jabatan)
    {
        $jabatan->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Jabatan berhasil dihapus'
        ]);
    }
}
