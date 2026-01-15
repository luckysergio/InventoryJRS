<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Distributor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DistributorController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');

        $distributors = Distributor::when($search, function ($query) use ($search) {
                $query->whereRaw(
                    'LOWER(nama) LIKE ?',
                    ['%' . strtolower($search) . '%']
                );
            })
            ->orderByRaw('LOWER(nama) ASC')
            ->get();

        return response()->json([
            'success'     => true,
            'distributors'=> $distributors
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'  => 'required|string|max:255',
            'no_hp' => 'required|string|max:20',
            'email' => 'required|email|unique:distributors,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $distributor = Distributor::create($request->only(
            'nama',
            'no_hp',
            'email'
        ));

        return response()->json([
            'success' => true,
            'message' => 'Distributor berhasil dibuat',
            'data'    => $distributor
        ], 201);
    }

    public function show($id)
    {
        $distributor = Distributor::find($id);

        if (!$distributor) {
            return response()->json([
                'success' => false,
                'message' => 'Distributor tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $distributor
        ]);
    }

    public function update(Request $request, $id)
    {
        $distributor = Distributor::find($id);

        if (!$distributor) {
            return response()->json([
                'success' => false,
                'message' => 'Distributor tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama'  => 'required|string|max:255',
            'no_hp' => 'required|string|max:20',
            'email' => "required|email|unique:distributors,email,{$id}"
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $distributor->update($request->only(
            'nama',
            'no_hp',
            'email'
        ));

        return response()->json([
            'success' => true,
            'message' => 'Distributor berhasil diperbarui',
            'data'    => $distributor
        ]);
    }

    public function destroy($id)
    {
        $distributor = Distributor::find($id);

        if (!$distributor) {
            return response()->json([
                'success' => false,
                'message' => 'Distributor tidak ditemukan'
            ], 404);
        }

        $distributor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Distributor berhasil dihapus'
        ]);
    }
}
