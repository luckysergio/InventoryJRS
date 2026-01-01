<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanProduct;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\Product;
use App\Models\TypeProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['jenis', 'type', 'bahan']);

        if ($request->filled('search')) {
            $query->where('kode', 'like', "%{$request->search}%");
        }

        if ($request->filled('jenis_id')) {
            $query->where('jenis_id', $request->jenis_id);
        }

        if ($request->filled('type_id')) {
            $query->where('type_id', $request->type_id);
        }

        $products = $query->orderBy('kode', 'asc')->paginate(15);

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil data product',
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    public function show($id)
    {
        $product = Product::with(['jenis', 'type', 'bahan'])->find($id);

        if (!$product) {
            return response()->json([
                'status'  => false,
                'message' => 'Product tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $product
        ]);
    }

    public function store(Request $request)
    {
        // Validasi dasar
        $validator = Validator::make($request->all(), [
            'kode'          => 'required|string|max:50|unique:products,kode',
            'jenis_id'      => 'nullable|exists:jenis_products,id',
            'jenis_nama'    => 'required_without:jenis_id|string|max:100',
            'type_id'       => 'nullable|exists:type_products,id',
            'type_nama'     => 'required_without:type_id|string|max:100',
            'bahan_id'      => 'nullable|exists:bahan_products,id',
            'bahan_nama'    => 'required_without:bahan_id|string|max:100',
            'ukuran'        => 'required|string|max:20',
            'keterangan'    => 'nullable|string',
        ], [
            'jenis_nama.required_without' => 'Jenis wajib diisi',
            'type_nama.required_without'  => 'Type wajib diisi jika tidak memilih dari daftar',
            'bahan_nama.required_without' => 'Bahan wajib diisi jika tidak memilih dari daftar',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // === JENIS ===
            $jenis_id = $request->jenis_id;

            if (!$jenis_id && !empty($request->jenis_nama)) {
                $namaJenis = trim($request->jenis_nama);
                $namaJenisNormalized = Str::title(strtolower($namaJenis));

                // ✅ Validasi unik case-insensitive untuk JENIS
                $existingJenis = JenisProduct::whereRaw('LOWER(nama) = ?', [strtolower($namaJenis)])->first();
                if ($existingJenis) {
                    $jenis_id = $existingJenis->id;
                } else {
                    $jenis = JenisProduct::create(['nama' => $namaJenisNormalized]);
                    $jenis_id = $jenis->id;
                }
            }

            if (!$jenis_id) {
                throw new \Exception('Jenis wajib diisi');
            }

            // === TYPE ===
            $type_id = null;

            if (!empty($request->type_nama)) {
                $namaType = trim($request->type_nama);
                $namaTypeNormalized = Str::title(strtolower($namaType));

                // ✅ Validasi unik case-insensitive untuk TYPE + jenis_id
                $existingType = TypeProduct::where('jenis_id', $jenis_id)
                    ->whereRaw('LOWER(nama) = ?', [strtolower($namaType)])
                    ->first();

                if ($existingType) {
                    $type_id = $existingType->id;
                } else {
                    $type = TypeProduct::create([
                        'nama' => $namaTypeNormalized,
                        'jenis_id' => $jenis_id
                    ]);
                    $type_id = $type->id;
                }
            } elseif (!empty($request->type_id)) {
                $type = TypeProduct::where('id', $request->type_id)
                    ->where('jenis_id', $jenis_id)
                    ->first();
                if (!$type) {
                    throw new \Exception('Type tidak sesuai dengan jenis yang dipilih');
                }
                $type_id = $type->id;
            }

            // === BAHAN ===
            $bahan_id = null;

            if (!empty($request->bahan_nama)) {
                $namaBahan = trim($request->bahan_nama);
                $namaBahanNormalized = Str::title(strtolower($namaBahan));

                // ✅ Validasi unik case-insensitive untuk BAHAN
                $existingBahan = BahanProduct::whereRaw('LOWER(nama) = ?', [strtolower($namaBahan)])->first();
                if ($existingBahan) {
                    $bahan_id = $existingBahan->id;
                } else {
                    $bahan = BahanProduct::create(['nama' => $namaBahanNormalized]);
                    $bahan_id = $bahan->id;
                }
            } elseif (!empty($request->bahan_id)) {
                $bahan_id = $request->bahan_id;
            }

            // === SIMPAN PRODUCT ===
            $productData = [
                'kode'       => $request->kode,
                'jenis_id'   => $jenis_id,
                'type_id'    => $type_id,
                'bahan_id'   => $bahan_id,
                'ukuran'     => $request->ukuran,
                'keterangan' => $request->keterangan ?? null,
            ];

            $product = Product::create($productData);

            // === BUAT INVENTORY ===
            $places = Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get();
            if ($places->count() < 2) {
                throw new \Exception('Place Bengkel atau Toko belum tersedia');
            }

            foreach ($places as $place) {
                Inventory::firstOrCreate([
                    'product_id' => $product->id,
                    'place_id'   => $place->id,
                ], ['qty' => 0]);
            }

            DB::commit();

            return response()->json([
                'status'  => true,
                'message' => 'Product & inventory berhasil dibuat',
                'data'    => $product->load(['jenis', 'type', 'bahan'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'status'  => false,
                'message' => 'Product tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'kode'       => 'required|string|max:50|unique:products,kode,' . $id,
            'jenis_id'   => 'required|exists:jenis_products,id',
            'type_id'    => 'nullable|exists:type_products,id',
            'bahan_id'   => 'nullable|exists:bahan_products,id',
            'ukuran'     => 'required|string|max:20',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        if ($request->type_id) {
            $type = TypeProduct::where('id', $request->type_id)
                ->where('jenis_id', $request->jenis_id)
                ->first();

            if (!$type) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Type tidak sesuai dengan jenis product'
                ], 422);
            }
        }

        $product->update($validator->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Product berhasil diperbarui',
            'data'    => $product->load(['jenis', 'type', 'bahan'])
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'status'  => false,
                'message' => 'Product tidak ditemukan'
            ], 404);
        }

        $product->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Product berhasil dihapus'
        ]);
    }

    public function getByProduct($productId)
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'status'  => false,
                'message' => 'Produk tidak ditemukan'
            ], 404);
        }

        $data = HargaProduct::where('product_id', $productId)
            ->orderBy('tanggal_berlaku', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($item) {
                $item->harga_rupiah = number_format($item->harga, 0, ',', '.');
                return $item;
            });

        return response()->json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function available()
    {
        $products = Product::whereHas('inventories', function ($q) {
            $q->where('qty', '>', 0)
                ->whereHas('place', function ($p) {
                    $p->where('kode', 'TOKO');
                });
        })
            ->with([
                'jenis',
                'type',
                'bahan',
                'inventories' => function ($q) {
                    $q->where('qty', '>', 0)
                        ->whereHas('place', function ($p) {
                            $p->where('kode', 'TOKO');
                        });
                },
                'inventories.place'
            ])
            ->get();

        return response()->json([
            'status'  => true,
            'message' => 'Berhasil mengambil produk tersedia di TOKO',
            'data'    => $products
        ]);
    }
}