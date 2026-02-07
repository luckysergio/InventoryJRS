<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        $inventories = Inventory::with(['product.jenis', 'product.type','product.bahan', 'place'])
            ->orderBy('place_id')
            ->orderBy('product_id')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil data inventory',
            'data' => $inventories
        ]);
    }

    public function byPlace($placeId)
    {
        $inventories = Inventory::with('product')
            ->where('place_id', $placeId)
            ->orderBy('product_id')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil inventory berdasarkan tempat',
            'data' => $inventories
        ]);
    }

    public function byProduct($productId)
    {
        $inventories = Inventory::with('place')
            ->where('product_id', $productId)
            ->orderBy('place_id')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil inventory berdasarkan produk',
            'data' => $inventories
        ]);
    }

    public function totalProduct($productId)
    {
        $total = Inventory::where('product_id', $productId)->sum('qty');

        return response()->json([
            'status' => true,
            'product_id' => $productId,
            'total_qty' => $total
        ]);
    }

    public function lowStock(Request $request)
    {
        $threshold = $request->get('threshold', 10);

        $inventories = Inventory::with(['product', 'place'])
            ->where('qty', '<=', $threshold)
            ->orderBy('qty')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Berhasil mengambil inventory stok rendah',
            'data' => $inventories
        ]);
    }
}
