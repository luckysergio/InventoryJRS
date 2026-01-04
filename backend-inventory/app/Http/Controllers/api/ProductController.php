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
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\Storage;

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
            'foto_depan'    => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_samping'  => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_atas'     => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            if ($request->filled('jenis_id')) {
                $jenis_id = $request->jenis_id;
            } else {
                $nama = Str::title(trim($request->jenis_nama));
                $jenis = JenisProduct::firstOrCreate(
                    ['nama' => $nama],
                    ['nama' => $nama]
                );
                $jenis_id = $jenis->id;
            }

            if ($request->filled('type_id')) {
                $type = TypeProduct::where('id', $request->type_id)
                    ->where('jenis_id', $jenis_id)
                    ->firstOrFail();
                $type_id = $type->id;
            } else {
                $nama = Str::title(trim($request->type_nama));
                $type = TypeProduct::firstOrCreate([
                    'nama' => $nama,
                    'jenis_id' => $jenis_id
                ]);
                $type_id = $type->id;
            }

            if ($request->filled('bahan_id')) {
                $bahan_id = $request->bahan_id;
            } else {
                $nama = Str::title(trim($request->bahan_nama));
                $bahan = BahanProduct::firstOrCreate(['nama' => $nama]);
                $bahan_id = $bahan->id;
            }

            $manager = new ImageManager(new Driver());

            $fotoPaths = [
                'foto_depan' => null,
                'foto_samping' => null,
                'foto_atas' => null,
            ];

            foreach ($fotoPaths as $field => $val) {
                if ($request->hasFile($field)) {
                    $image = $manager->read($request->file($field));

                    if ($image->width() > 800) {
                        $image->scale(width: 800);
                    }

                    $filename = 'products/' . Str::uuid() . '.jpg';

                    // pastikan folder ada
                    Storage::disk('public')->makeDirectory('products');

                    Storage::disk('public')->put(
                        $filename,
                        (string) $image->toJpeg(85)
                    );

                    $fotoPaths[$field] = $filename;
                }
            }

            $product = Product::create([
                'kode' => $request->kode,
                'jenis_id' => $jenis_id,
                'type_id' => $type_id,
                'bahan_id' => $bahan_id,
                'ukuran' => $request->ukuran,
                'keterangan' => $request->keterangan,
                'foto_depan' => $fotoPaths['foto_depan'],
                'foto_samping' => $fotoPaths['foto_samping'],
                'foto_atas' => $fotoPaths['foto_atas'],
            ]);

            $places = Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get();

            foreach ($places as $place) {
                Inventory::firstOrCreate([
                    'product_id' => $product->id,
                    'place_id' => $place->id,
                ], ['qty' => 0]);
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Product berhasil dibuat',
                'data' => $product->load(['jenis', 'type', 'bahan'])
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Product tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'kode'       => 'required|string|max:50|unique:products,kode,' . $id,
            'jenis_id'   => 'required|exists:jenis_products,id',
            'type_id'    => 'nullable|exists:type_products,id',
            'type_nama'  => 'nullable|string|max:100',
            'bahan_id'   => 'nullable|exists:bahan_products,id',
            'bahan_nama' => 'nullable|string|max:100',
            'ukuran'     => 'required|string|max:20',
            'keterangan' => 'nullable|string',
            'foto_depan'    => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_samping'  => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_atas'     => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
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
            $jenis_id = $request->jenis_id;
            $type_id = null;

            if ($request->filled('type_nama')) {
                $nama = Str::title(trim($request->type_nama));

                $type = TypeProduct::firstOrCreate([
                    'nama' => $nama,
                    'jenis_id' => $jenis_id
                ]);

                $type_id = $type->id;
            } elseif ($request->filled('type_id')) {
                $type = TypeProduct::where('id', $request->type_id)
                    ->where('jenis_id', $jenis_id)
                    ->first();

                if (!$type) {
                    throw new \Exception('Type tidak sesuai dengan jenis product');
                }

                $type_id = $type->id;
            }

            $updateData = [
                'kode'       => $request->kode,
                'jenis_id'   => $jenis_id,
                'type_id'    => $type_id,
                'bahan_id'   => $request->bahan_id,
                'ukuran'     => $request->ukuran,
                'keterangan' => $request->keterangan,
            ];

            $manager = new ImageManager(new Driver());

            foreach (['foto_depan', 'foto_samping', 'foto_atas'] as $foto) {
                if ($request->hasFile($foto)) {

                    if ($product->{$foto}) {
                        Storage::disk('public')->delete($product->{$foto});
                    }

                    $image = $manager->read($request->file($foto));

                    if ($image->width() > 800) {
                        $image->scale(width: 800);
                    }

                    $filename = 'products/' . Str::uuid() . '.jpg';

                    Storage::disk('public')->makeDirectory('products');

                    Storage::disk('public')->put(
                        $filename,
                        (string) $image->toJpeg(85)
                    );

                    $updateData[$foto] = $filename;
                }
            }

            $product->update($updateData);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Product berhasil diperbarui',
                'data' => $product->load(['jenis', 'type', 'bahan'])
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
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

        foreach (['foto_depan', 'foto_samping', 'foto_atas'] as $foto) {
            if ($product->{$foto}) {
                $path = storage_path('app/public/' . $product->{$foto});
                if (file_exists($path)) {
                    unlink($path);
                }
            }
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

    public function lowStock()
    {
        $products = Product::whereHas('inventories', function ($q) {
            $q->where('qty', '<', 20)
                ->whereHas('place', function ($p) {
                    $p->whereIn('kode', ['TOKO','BENGKEL']);
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
