<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductMovement;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProductMovementController extends Controller
{
    public function index()
    {
        $movements = ProductMovement::with(
            'inventory.product',
            'inventory.place',
            'inventory.product.jenis',
            'inventory.product.type',
        )
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data mutasi produk',
            'data' => $movements
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'inventory_id'      => 'required|exists:inventories,id',
            'tipe'              => 'required|in:in,out,transfer,produksi',
            'qty'               => 'required|integer|min:1',
            'to_place_id'       => 'nullable|exists:places,id',
            'keterangan'        => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $inventoryFrom = Inventory::lockForUpdate()->find($request->inventory_id);

            if (in_array($request->tipe, ['out', 'transfer']) && $inventoryFrom->qty < $request->qty) {
                return response()->json([
                    'status' => false,
                    'message' => 'Stok tidak mencukupi'
                ], 422);
            }

            if (in_array($request->tipe, ['in', 'produksi'])) {
                $inventoryFrom->increment('qty', $request->qty);

                ProductMovement::create([
                    'inventory_id' => $inventoryFrom->id,
                    'tipe' => $request->tipe,
                    'qty' => $request->qty,
                    'keterangan' => $request->keterangan
                ]);
            }

            if ($request->tipe === 'out') {
                $inventoryFrom->decrement('qty', $request->qty);

                ProductMovement::create([
                    'inventory_id' => $inventoryFrom->id,
                    'tipe' => 'out',
                    'qty' => $request->qty,
                    'keterangan' => $request->keterangan
                ]);
            }

            if ($request->tipe === 'transfer') {
                if (!$request->to_place_id) {
                    throw new \Exception('Tempat tujuan wajib diisi');
                }

                $inventoryFrom->decrement('qty', $request->qty);

                $inventoryTo = Inventory::firstOrCreate(
                    [
                        'product_id' => $inventoryFrom->product_id,
                        'place_id'   => $request->to_place_id,
                    ],
                    [
                        'qty' => 0
                    ]
                );

                $inventoryTo->increment('qty', $request->qty);

                ProductMovement::create([
                    'inventory_id' => $inventoryFrom->id,
                    'tipe' => 'transfer',
                    'qty' => $request->qty,
                    'keterangan' => 'Transfer ke ' . $inventoryTo->place->nama
                ]);

                ProductMovement::create([
                    'inventory_id' => $inventoryTo->id,
                    'tipe' => 'in',
                    'qty' => $request->qty,
                    'keterangan' => 'Transfer dari ' . $inventoryFrom->place->nama
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Mutasi produk berhasil'
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
