<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class PublicProductController extends Controller
{
    // HAPUS fungsi buildFotoUrls karena kita tidak akan mengubah struktur data
    // protected function buildFotoUrls($product)
    // {
    //     return [
    //         'depan'   => $product->foto_depan   ? asset('storage/' . $product->foto_depan)   : null,
    //         'samping' => $product->foto_samping ? asset('storage/' . $product->foto_samping) : null,
    //         'atas'    => $product->foto_atas    ? asset('storage/' . $product->foto_atas)    : null,
    //     ];
    // }

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
        // 🔹 Tambahkan relasi yang SAMA dengan controller Product biasa
        $query = Product::with([
            'jenis',
            'type',
            'bahan',
            'hargaProducts' => function ($q) {
                $q->whereNull('customer_id')
                    ->orderBy('tanggal_berlaku', 'desc')
                    ->limit(1);
            },
            'inventories.place' => function ($q) {
                $q->whereIn('kode', ['TOKO', 'BENGKEL']);
            }
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
            // 🔹 Ambil harga umum dari relasi yang sudah difilter
            $hargaUmum = $product->hargaProducts->first();
            $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;

            // 🔹 Hitung qty toko dan bengkel seperti di controller biasa
            $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
            $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');

            $product->qty_toko = $toko ? $toko->qty : 0;
            $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;

            $product->jenis = $product->jenis ?? (object) ['id' => null, 'nama' => '-'];
            $product->type = $product->type ?? (object) ['id' => null, 'nama' => '-'];
            $product->bahan = $product->bahan ?? (object) ['id' => null, 'nama' => '-'];

            // 🔹 JANGAN buat field 'foto', biarkan foto_depan, foto_samping, foto_atas tetap ada
            // 🔹 JANGAN hapus field foto_depan, foto_samping, foto_atas
            // unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
            
            // 🔹 Hapus relasi yang tidak perlu dikirim ke frontend
            unset($product->hargaProducts);
            unset($product->inventories);

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
                'hargaProducts' => function ($q) {
                    $q->whereNull('customer_id')
                        ->orderBy('tanggal_berlaku', 'desc')
                        ->limit(1);
                },
                'inventories.place' => function ($q) {
                    $q->whereIn('kode', ['TOKO', 'BENGKEL']);
                }
            ])
            ->orderBy('kode', 'asc')
            ->get();

        $products->each(function ($product) {
            // 🔹 Ambil harga umum
            $hargaUmum = $product->hargaProducts->first();
            $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;

            // 🔹 Hitung qty toko dan bengkel
            $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
            $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');

            $product->qty_toko = $toko ? $toko->qty : 0;
            $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;

            $product->jenis = $product->jenis ?? (object) ['nama' => '-'];
            $product->type = $product->type ?? (object) ['nama' => '-'];
            $product->bahan = $product->bahan ?? (object) ['nama' => '-'];

            // 🔹 JANGAN buat field 'foto' dan JANGAN hapus field foto_depan, dll
            // unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
            
            unset($product->hargaProducts);
            unset($product->inventories);
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
        
        // 🔹 Gunakan relasi yang SAMA dengan controller biasa
        $products = Product::with([
                'jenis',
                'type',
                'bahan',
                'hargaProducts' => function ($q) {
                    $q->whereNull('customer_id')
                        ->orderBy('tanggal_berlaku', 'desc')
                        ->limit(1);
                },
                'inventories.place' => function ($q) {
                    $q->whereIn('kode', ['TOKO', 'BENGKEL']);
                }
            ])
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $result = [];
        foreach ($aggregated as $item) {
            if (isset($products[$item->product_id])) {
                $product = $products[$item->product_id];
                $product->total_terjual = (int) $item->total_qty;
                
                // 🔹 Ambil harga umum
                $hargaUmum = $product->hargaProducts->first();
                $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;

                // 🔹 Hitung qty toko dan bengkel
                $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
                $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');

                $product->qty_toko = $toko ? $toko->qty : 0;
                $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;

                $product->jenis = $product->jenis ?? (object) ['nama' => '-'];
                $product->type = $product->type ?? (object) ['nama' => '-'];
                $product->bahan = $product->bahan ?? (object) ['nama' => '-'];

                // 🔹 JANGAN buat field 'foto' dan JANGAN hapus field foto_depan, dll
                // unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
                
                unset($product->hargaProducts);
                unset($product->inventories);

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
        // 🔹 Gunakan relasi yang SAMA dengan controller biasa
        $product = Product::with([
                'jenis',
                'type',
                'bahan',
                'hargaProducts' => function ($q) {
                    $q->whereNull('customer_id')
                        ->orderBy('tanggal_berlaku', 'desc')
                        ->limit(1);
                },
                'inventories.place' => function ($q) {
                    $q->whereIn('kode', ['TOKO', 'BENGKEL']);
                }
            ])
            ->find($id);

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Produk tidak ditemukan'
            ], 404);
        }

        // 🔹 Ambil harga umum
        $hargaUmum = $product->hargaProducts->first();
        $product->harga_umum = $hargaUmum ? $hargaUmum->harga : null;

        // 🔹 Hitung qty toko dan bengkel
        $toko = $product->inventories->firstWhere('place.kode', 'TOKO');
        $bengkel = $product->inventories->firstWhere('place.kode', 'BENGKEL');

        $product->qty_toko = $toko ? $toko->qty : 0;
        $product->qty_bengkel = $bengkel ? $bengkel->qty : 0;

        $product->jenis = $product->jenis ?? (object) ['nama' => '-'];
        $product->type = $product->type ?? (object) ['nama' => '-'];
        $product->bahan = $product->bahan ?? (object) ['nama' => '-'];

        // 🔹 JANGAN buat field 'foto' dan JANGAN hapus field foto_depan, dll
        // unset($product->foto_depan, $product->foto_samping, $product->foto_atas);
        
        unset($product->hargaProducts);
        unset($product->inventories);

        return response()->json([
            'status' => true,
            'data' => $product
        ]);
    }
}