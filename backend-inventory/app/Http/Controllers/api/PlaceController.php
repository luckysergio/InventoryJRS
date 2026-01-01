<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PlaceController extends Controller
{
    public function index()
    {
        $places = Place::all();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data tempat',
            'data' => $places
        ]);
    }

    public function show($id)
    {
        $place = Place::find($id);

        if (!$place) {
            return response()->json([
                'status' => false,
                'message' => 'Tempat tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $place
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:20|unique:places,kode',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $place = Place::create($validator->validated());

        return response()->json([
            'status' => true,
            'message' => 'Tempat berhasil dibuat',
            'data' => $place
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $place = Place::find($id);

        if (!$place) {
            return response()->json([
                'status' => false,
                'message' => 'Tempat tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:20|unique:places,kode,' . $id,
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $place->update($validator->validated());

        return response()->json([
            'status' => true,
            'message' => 'Tempat berhasil diperbarui',
            'data' => $place
        ]);
    }

    public function destroy($id)
    {
        $place = Place::find($id);

        if (!$place) {
            return response()->json([
                'status' => false,
                'message' => 'Tempat tidak ditemukan'
            ], 404);
        }

        $place->delete();

        return response()->json([
            'status' => true,
            'message' => 'Tempat berhasil dihapus'
        ]);
    }
}
