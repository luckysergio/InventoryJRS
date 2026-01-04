<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\StokOpname;
use App\Models\DetailStokOpname;
use App\Models\Inventory;
use App\Models\ProductMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StokOpnameController extends Controller
{
    public function index()
    {
        return StokOpname::with([
            'user',
            'details.inventory.product.jenis',
            'details.inventory.product.type',
            'details.inventory.product.bahan',
            'details.inventory.place'
        ])->latest()->get();
    }

    public function store(Request $request)
{
    $data = $request->validate([
        'tgl_opname' => 'required|date',
        'keterangan' => 'nullable|string',
        'inventory_ids' => 'required|array',
        'inventory_ids.*' => 'exists:inventories,id'
    ]);

    DB::beginTransaction();
    try {
        $stokOpname = StokOpname::create([
            'user_id' => Auth::id(),
            'tgl_opname' => $data['tgl_opname'],
            'keterangan' => $data['keterangan'] ?? null,
            'status' => 'draft'
        ]);

        $inventories = Inventory::whereIn('id', $data['inventory_ids'])->get();
        foreach ($inventories as $inv) {
            DetailStokOpname::create([
                'stok_opname_id' => $stokOpname->id,
                'inventory_id' => $inv->id,
                'stok_sistem' => $inv->qty,
                'stok_real' => null,
                'selisih' => null,
                'keterangan' => null
            ]);
        }

        DB::commit();
        return response()->json($stokOpname->load('details'), 201);
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}

    public function show($id)
    {
        $stokOpname = StokOpname::with([
            'details.inventory.product',
            'user'
        ])->findOrFail($id);

        return response()->json($stokOpname);
    }

    public function storeDetail(Request $request, $stokOpnameId)
    {
        $stokOpname = StokOpname::findOrFail($stokOpnameId);

        if ($stokOpname->status !== 'draft') {
            return response()->json([
                'message' => 'Stok opname sudah dikunci'
            ], 422);
        }

        $data = $request->validate([
            'inventory_id' => 'required|exists:inventories,id',
            'stok_real' => 'nullable|integer|min:0',
            'keterangan' => 'nullable|string'
        ]);

        $detail = DetailStokOpname::where('stok_opname_id', $stokOpnameId)
            ->where('inventory_id', $data['inventory_id'])
            ->firstOrFail();

        $selisih = null;
        if ($data['stok_real'] !== null) {
            $selisih = $data['stok_real'] - $detail->stok_sistem;
        }

        $detail->update([
            'stok_real' => $data['stok_real'],
            'selisih' => $selisih,
            'keterangan' => $data['keterangan'] ?? $detail->keterangan
        ]);

        return response()->json($detail->fresh());
    }

    public function selesai($id)
    {
        $stokOpname = StokOpname::with('details')->findOrFail($id);

        if ($stokOpname->status !== 'draft') {
            return response()->json(['message' => 'Stok opname sudah diproses'], 422);
        }

        $hasUnfilled = $stokOpname->details->contains(function ($detail) {
            return $detail->stok_real === null;
        });

        if ($hasUnfilled) {
            return response()->json([
                'message' => 'Masih ada item yang belum diisi stok real-nya'
            ], 422);
        }

        DB::transaction(function () use ($stokOpname) {
            foreach ($stokOpname->details as $detail) {
                if ($detail->selisih == 0) continue;

                ProductMovement::create([
                    'inventory_id' => $detail->inventory_id,
                    'product_id' => $detail->inventory->product_id,
                    'tipe' => $detail->selisih > 0 ? 'in' : 'out',
                    'qty' => abs($detail->selisih),
                    'ref_type' => 'stok_opname',
                    'ref_id' => $stokOpname->id,
                    'keterangan' => 'Penyesuaian stok opname'
                ]);

                Inventory::where('id', $detail->inventory_id)
                    ->increment('qty', $detail->selisih);
            }

            $stokOpname->update(['status' => 'selesai']);
        });

        return response()->json(['message' => 'Stok opname berhasil diselesaikan']);
    }

    public function batalkan($id)
    {
        $stokOpname = StokOpname::findOrFail($id);

        if ($stokOpname->status !== 'draft') {
            return response()->json([
                'message' => 'Tidak bisa membatalkan stok opname'
            ], 422);
        }

        $stokOpname->update([
            'status' => 'dibatalkan'
        ]);

        return response()->json([
            'message' => 'Stok opname dibatalkan'
        ]);
    }
}
