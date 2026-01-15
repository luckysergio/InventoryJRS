<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    Product,
    Distributor,
    JenisProduct,
    TypeProduct,
    BahanProduct,
    HargaProduct,
    Inventory,
    Place,
    ProductMovement
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Validator, Storage};
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductDistributorController extends Controller
{
    public function index()
    {
        $products = Product::with([
            'jenis', 
            'type', 
            'bahan', 
            'distributor',
            'hargaProducts' => function ($q) {
                $q->whereNull('customer_id')
                    ->orderBy('tanggal_berlaku', 'desc')
                    ->limit(1);
            },
            'inventories.place' => function ($q) {
                $q->whereIn('kode', ['TOKO', 'BENGKEL']);
            }])
            ->whereNotNull('distributor_id')
            ->orderBy('kode')
            ->paginate(15);

        return response()->json([
            'status' => true,
            'data'   => $products->items(),
            'meta'   => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = $this->validator($request);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            [$jenis, $type, $bahan] = $this->resolveMasterData($request);
            $distributor = Distributor::findOrFail($request->distributor_id);

            $kode = $this->generateKode(
                $jenis,
                $type,
                $bahan,
                $request->ukuran,
                $distributor->nama
            );

            $product = Product::create(array_merge([
                'kode'           => $kode,
                'jenis_id'       => $jenis->id,
                'type_id'        => $type?->id,
                'bahan_id'       => $bahan?->id,
                'ukuran'         => $request->ukuran,
                'keterangan'     => $request->keterangan,
                'distributor_id' => $distributor->id,
                'harga_beli'     => $request->harga_beli,
            ], $this->uploadImages($request)));

            $this->storeHarga($product, $request->harga_umum, 'Harga awal');
            $this->initInventory($product);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Product distributor berhasil dibuat',
                'data' => $product->load(['jenis', 'type', 'bahan', 'distributor'])
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
        $product = Product::findOrFail($id);
        $validator = $this->validator($request, true);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            [$jenis, $type, $bahan] = $this->resolveMasterData($request);
            $distributor = Distributor::findOrFail($request->distributor_id);

            $kode = $this->generateKode(
                $jenis,
                $type,
                $bahan,
                $request->ukuran,
                $distributor->nama,
                $product->id
            );

            $product->update(array_merge([
                'kode'           => $kode,
                'jenis_id'       => $jenis->id,
                'type_id'        => $type?->id,
                'bahan_id'       => $bahan?->id,
                'ukuran'         => $request->ukuran,
                'keterangan'     => $request->keterangan,
                'distributor_id' => $distributor->id,
                'harga_beli'     => $request->harga_beli,
            ], $this->uploadImages($request, $product)));

            $product->hargaProducts()->whereNull('customer_id')->delete();
            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => null,
                'harga' => $request->harga_umum,
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga diperbarui'
            ]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Product distributor berhasil diperbarui',
                'data' => $product->load(['jenis', 'type', 'bahan', 'distributor'])
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

    private function validator(Request $request, bool $update = false)
    {
        return Validator::make($request->all(), [
            'jenis_id' => 'required_without:jenis_nama|exists:jenis_products,id',
            'jenis_nama' => [
                    'required_without:jenis_id',
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],
            'type_id' => 'nullable|exists:type_products,id',
            'type_nama' => [
                'required_without:type_id',
                'string',
                'max:100',
                'regex:/^[A-Z0-9\s]+$/'
            ],
            'bahan_id' => 'nullable|exists:bahan_products,id',
            'bahan_nama' => [
                'required_without:bahan_id',
                'string',
                'max:100',
                'regex:/^[A-Z0-9\s]+$/'
            ],
            'ukuran' => 'required|string|max:20',
            'distributor_id' => 'required|exists:distributors,id',
            'harga_beli' => 'required|integer|min:0',
            'harga_umum' => 'required|integer|min:0',
            'keterangan' => 'nullable|string',
            'foto_depan' => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_samping' => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_atas' => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
        ]);
    }

    private function resolveMasterData(Request $request): array
    {
        $jenis = $request->filled('jenis_id')
            ? JenisProduct::findOrFail($request->jenis_id)
            : JenisProduct::firstOrCreate(['nama' => Str::title(trim($request->jenis_nama))]);

        $type = $request->filled('type_nama')
            ? TypeProduct::firstOrCreate([
                'nama' => Str::title(trim($request->type_nama)),
                'jenis_id' => $jenis->id
            ])
            : ($request->filled('type_id') ? TypeProduct::findOrFail($request->type_id) : null);

        $bahan = $request->filled('bahan_nama')
            ? BahanProduct::firstOrCreate(['nama' => Str::title(trim($request->bahan_nama))])
            : ($request->filled('bahan_id') ? BahanProduct::findOrFail($request->bahan_id) : null);

        return [$jenis, $type, $bahan];
    }

    private function generateBaseProductKode(
        JenisProduct $jenis,
        ?TypeProduct $type,
        ?BahanProduct $bahan,
        string $ukuran
    ): string {
        $jenisKode = strtoupper(substr($jenis->nama, 0, 1));

        $typeKode = $type
            ? $this->extractInitials($type->nama, 2) . $this->extractNumbers($type->nama)
            : '';

        $bahanKode = $bahan
            ? $this->extractInitials($bahan->nama, 2)
            : '';

        $ukuranKode = $this->extractNumbers($ukuran);

        return strtoupper($jenisKode . $typeKode . $bahanKode . $ukuranKode);
    }

    private function generateKode(
        JenisProduct $jenis,
        ?TypeProduct $type,
        ?BahanProduct $bahan,
        string $ukuran,
        string $distributorNama,
        ?int $ignoreId = null
    ): string {
        $baseKode = $this->generateBaseProductKode($jenis, $type, $bahan, $ukuran);

        $prefix = collect(explode(' ', $distributorNama))
            ->map(fn($w) => strtoupper(substr($w, 0, 1)))
            ->implode('');

        return $this->makeUniqueKode("{$prefix}-{$baseKode}", $ignoreId);
    }

    private function makeUniqueKode(string $kode, ?int $ignoreId = null): string
    {
        $final = $kode;
        $i = 1;

        while (
            Product::where('kode', $final)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $final = "{$kode}-{$i}";
            $i++;
        }

        return $final;
    }

    private function extractInitials(string $text, int $max = 2): string
    {
        $words = preg_split('/\s+/', trim($text));
        $initials = '';

        foreach ($words as $word) {
            $char = strtoupper(substr($word, 0, 1));
            if (ctype_alpha($char)) {
                $initials .= $char;
            }
            if (strlen($initials) >= $max) break;
        }

        return $initials;
    }

    private function extractNumbers(string $text): string
    {
        preg_match_all('/\d+/', $text, $matches);
        return implode('', $matches[0]);
    }

    private function uploadImages(Request $request, ?Product $product = null): array
    {
        $manager = new ImageManager(new Driver());
        $data = [];

        foreach (['foto_depan', 'foto_samping', 'foto_atas'] as $field) {
            if ($request->hasFile($field)) {
                if ($product && $product->{$field}) {
                    Storage::disk('public')->delete($product->{$field});
                }

                $image = $manager->read($request->file($field));
                if ($image->width() > 800) {
                    $image->scale(width: 800);
                }

                $path = 'products/' . Str::uuid() . '.jpg';
                Storage::disk('public')->put($path, (string) $image->toJpeg(85));
                $data[$field] = $path;
            }
        }

        return $data;
    }

    private function storeHarga(Product $product, int $harga, string $ket)
    {
        HargaProduct::create([
            'product_id' => $product->id,
            'customer_id' => null,
            'harga' => $harga,
            'tanggal_berlaku' => now(),
            'keterangan' => $ket
        ]);
    }

    private function initInventory(Product $product)
    {
        foreach (Place::where('kode', 'TOKO')->get() as $place) {
            Inventory::firstOrCreate(
                ['product_id' => $product->id, 'place_id' => $place->id],
                ['qty' => 0]
            );
        }
    }
}
