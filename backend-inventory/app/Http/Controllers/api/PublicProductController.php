<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class PublicProductController extends Controller
{
    protected function buildFotoUrls($product)
    {
        return [
            'depan'   => $product->foto_depan   ? asset('storage/' . $product->foto_depan)   : null,
            'samping' => $product->foto_samping ? asset('storage/' . $product->foto_samping) : null,
            'atas'    => $product->foto_atas    ? asset('storage/' . $product->foto_atas)    : null,
        ];
    }

    // Helper untuk ambil harga umum (tanpa customer_id)
    protected function getHargaUmum($product)
    {
        return $product->hargaProducts
            ->where('customer_id', null)
            ->sortByDesc('tanggal_berlaku')
            ->first()?->harga;
    }

    public function index(Request $request)
    {
        // 🔹 Tambahkan relasi hargaProducts
        $query = Product::with([
            'jenis',
            'type',
            'bahan',
            'hargaProducts' // ← penting!
        ]);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('nama', 'like', "%{$searchTerm}%")
                    ->orWhere('kode', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->filled('jenis_id')) {
            $query->where('jenis_id', $request->jenis_id);
        }

        if ($request->filled('type_id')) {
            $query->where('type_id', $request->type_id);
        }

        $products = $query->orderBy('kode', 'asc')->paginate(12);

        $products->getCollection()->transform(function ($product) {
            $product->foto = $this->buildFotoUrls($product);
            // 🔹 Ambil harga umum
            $product->harga_umum = $this->getHargaUmum($product);

            $product->jenis = $product->jenis ?? (object) ['id' => null, 'nama' => '-'];
            $product->type = $product->type ?? (object) ['id' => null, 'nama' => '-'];
            $product->bahan = $product->bahan ?? (object) ['id' => null, 'nama' => '-'];

            // Bersihkan field yang tidak perlu
            unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
            unset($product->hargaProducts); // jangan kirim ke frontend

            return $product;
        });

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil katalog produk',
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    public function available()
    {
        $products = Product::whereHas('inventories', function ($query) {
                $query->where('qty', '>', 0)
                      ->whereHas('place', function ($placeQuery) {
                          $placeQuery->where('kode', 'TOKO');
                      });
            })
            ->with([
                'jenis',
                'type',
                'bahan',
                'hargaProducts' // ← tambahkan ini
            ])
            ->orderBy('kode', 'asc')
            ->get();

        $products->each(function ($product) {
            $product->foto = $this->buildFotoUrls($product);
            $product->harga_umum = $this->getHargaUmum($product);

            $product->jenis = $product->jenis ?? (object) ['nama' => '-'];
            $product->type = $product->type ?? (object) ['nama' => '-'];
            $product->bahan = $product->bahan ?? (object) ['nama' => '-'];

            unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
            unset($product->hargaProducts);
        });

        return response()->json([
            'status'  => true,
            'message' => 'Produk tersedia di TOKO',
            'data'    => $products
        ]);
    }

    public function bestSeller(Request $request)
    {
        $limit = (int) $request->get('limit', 6);
        if ($limit < 1) $limit = 6;
        if ($limit > 20) $limit = 20;

        $aggregated = DB::table('transaksi_details as td')
            ->join('transaksis as t', 't.id', '=', 'td.transaksi_id')
            ->join('status_transaksis as st', 'st.id', '=', 'td.status_transaksi_id')
            ->where('st.nama', 'Selesai')
            ->select(
                'td.product_id',
                DB::raw('SUM(td.qty) as total_qty')
            )
            ->groupBy('td.product_id')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();

        if ($aggregated->isEmpty()) {
            return response()->json([
                'status' => true,
                'message' => 'Tidak ada produk terlaris',
                'data' => []
            ]);
        }

        $productIds = $aggregated->pluck('product_id')->toArray();
        // 🔹 Tambahkan hargaProducts di sini juga
        $products = Product::with([
                'jenis',
                'type',
                'bahan',
                'hargaProducts'
            ])
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $result = [];
        foreach ($aggregated as $item) {
            if (isset($products[$item->product_id])) {
                $product = $products[$item->product_id];
                $product->total_terjual = (int) $item->total_qty;
                $product->foto = $this->buildFotoUrls($product);
                $product->harga_umum = $this->getHargaUmum($product); // ← harga!

                $product->jenis = $product->jenis ?? (object) ['nama' => '-'];
                $product->type = $product->type ?? (object) ['nama' => '-'];
                $product->bahan = $product->bahan ?? (object) ['nama' => '-'];

                unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
                unset($product->hargaProducts);

                $result[] = $product;
            }
        }

        usort($result, fn($a, $b) => $b->total_terjual <=> $a->total_terjual);

        return response()->json([
            'status' => true,
            'message' => 'Produk terlaris',
            'data' => $result
        ]);
    }

    public function show($id)
    {
        $product = Product::with([
                'jenis',
                'type',
                'bahan',
                'hargaProducts' // ← jangan lupa!
            ])
            ->find($id);

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Produk tidak ditemukan'
            ], 404);
        }

        $product->foto = $this->buildFotoUrls($product);
        $product->harga_umum = $this->getHargaUmum($product);

        $product->jenis = $product->jenis ?? (object) ['nama' => '-'];
        $product->type = $product->type ?? (object) ['nama' => '-'];
        $product->bahan = $product->bahan ?? (object) ['nama' => '-'];

        unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
        unset($product->hargaProducts);

        return response()->json([
            'status' => true,
            'data' => $product
        ]);
    }
}