<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\BahanProduct;
use App\Models\Customer;
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

class ProductCustomerController extends Controller
{

    private function extractInitials(?string $text, int $max = 2): string
    {
        if (!$text) return '';

        return collect(
            preg_split('/\s+/', trim(Str::ascii($text)))
        )
            ->map(fn($w) => strtoupper(substr($w, 0, 1)))
            ->filter(fn($c) => ctype_alpha($c))
            ->take($max)
            ->implode('');
    }

    private function extractNumbers(?string $text): string
    {
        if (!$text) return '';

        preg_match_all('/\d+/', $text, $matches);
        return implode('', $matches[0]);
    }

    private function generateCustomerPrefix(string $customerName, string $customerPhone): string
    {
        $initial = collect(
            preg_split('/\s+/', trim(Str::ascii($customerName)))
        )
            ->map(fn($w) => strtoupper(substr($w, 0, 1)))
            ->filter(fn($c) => ctype_alpha($c))
            ->take(4)
            ->implode('');

        $hp = preg_replace('/\D/', '', $customerPhone);
        $last4 = substr($hp, -4);

        return $initial . $last4;
    }

    private function jenisKode(string $jenis): string
    {
        $jenis = strtoupper(trim($jenis));

        if (strlen($jenis) < 2) return $jenis;

        return substr($jenis, 0, 1) . substr($jenis, -1);
    }

    private function typeKode(string $text): string
    {
        $clean = preg_replace('/\(.+?\)/', '', strtoupper($text));

        $words = collect(
            preg_split('/\s+/', trim($clean))
        )->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));

        if ($words->count() === 1) {
            $huruf = substr($words->first(), 0, 2);
        } else {
            $huruf = $words->map(fn($w) => substr($w, 0, 1))->implode('');
        }

        preg_match_all('/\d+/', $text, $matches);
        $angka = count($matches[0]) >= 2
            ? $matches[0][0] . $matches[0][1]
            : ($matches[0][0] ?? '');

        return strtoupper($huruf . $angka);
    }

    private function bahanKode(string $text): string
    {
        $clean = preg_replace('/\(.+?\)/', '', strtoupper($text));

        $words = collect(
            preg_split('/\s+/', trim($clean))
        )->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));

        if ($words->count() === 1) {
            return substr($words->first(), 0, 2);
        }

        return $words
            ->map(fn($w) => substr($w, 0, 1))
            ->implode('');
    }

    private function makeUniqueKode(string $baseKode): string
    {
        $kode = $baseKode;
        $i = 1;

        while (Product::where('kode', $kode)->exists()) {
            $kode = "{$baseKode}-{$i}";
            $i++;
        }

        return $kode;
    }

    private function generateBaseProductKode(
        string $jenisNama,
        ?string $typeNama,
        ?string $bahanNama,
        string $ukuran
    ): string {
        return strtoupper(
            $this->jenisKode($jenisNama) .
                ($typeNama ? $this->typeKode($typeNama) : '') .
                ($bahanNama ? $this->bahanKode($bahanNama) : '') .
                $this->extractNumbers($ukuran)
        );
    }

    private function generatePesananProductKode(
        string $customerName,
        string $customerPhone,
        string $jenisNama,
        ?string $typeNama,
        ?string $bahanNama,
        string $ukuran
    ): string {
        $prefix = $this->generateCustomerPrefix($customerName, $customerPhone);

        $baseKode = $this->generateBaseProductKode(
            $jenisNama,
            $typeNama,
            $bahanNama,
            $ukuran
        );

        return $this->makeUniqueKode("{$prefix}-{$baseKode}");
    }

    public function index(Request $request)
    {
        $query = Product::with([
            'customer:id,name,phone',
            'jenis:id,nama',
            'type:id,nama,jenis_id',
            'bahan:id,nama',
            'hargaProducts' => function ($q) {
                $q->orderBy('tanggal_berlaku', 'desc');
            }
        ])
            ->whereNotNull('customer_id');

        // 🔍 Search multi-field: Kode + Nama Produk
        if ($request->filled('search')) {
            $searchTerm = "%{$request->search}%";

            $query->where(function ($q) use ($searchTerm) {
                $q->where('kode', 'like', $searchTerm)
                    ->orWhereHas('jenis', fn($q) => $q->where('nama', 'like', $searchTerm))
                    ->orWhereHas('type', fn($q) => $q->where('nama', 'like', $searchTerm))
                    ->orWhereHas('bahan', fn($q) => $q->where('nama', 'like', $searchTerm))
                    ->orWhere('ukuran', 'like', $searchTerm);
            });
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $products = $query->orderBy('kode')->paginate(15);

        return response()->json([
            'status' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    public function show($id)
    {
        $product = Product::with(['jenis', 'type', 'bahan'])
            ->whereNotNull('customer_id')
            ->find($id);

        if (!$product) {
            return response()->json([
                'status' => false,
                'message' => 'Produk customer tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $product
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',

            'jenis_id'   => 'nullable|exists:jenis_products,id',
            'jenis_nama' => 'required_without:jenis_id|string|max:100',

            'type_id'   => 'nullable|exists:type_products,id',
            'type_nama' => 'required_without:type_id|string|max:100',

            'bahan_id'   => 'nullable|exists:bahan_products,id',
            'bahan_nama' => 'required_without:bahan_id|string|max:100',

            'ukuran'     => 'required|string|max:50',
            'keterangan' => 'nullable|string',
            'harga'      => 'required|integer|min:0',

            'foto_depan'   => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_samping' => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_atas'    => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $customer = Customer::findOrFail($request->customer_id);

            $jenis = $request->filled('jenis_id')
                ? JenisProduct::findOrFail($request->jenis_id)
                : JenisProduct::firstOrCreate([
                    'nama' => strtoupper(trim($request->jenis_nama))
                ]);

            $type = $request->filled('type_id')
                ? TypeProduct::findOrFail($request->type_id)
                : TypeProduct::firstOrCreate([
                    'nama' => strtoupper(trim($request->type_nama)),
                    'jenis_id' => $jenis->id
                ]);

            $bahan = $request->filled('bahan_id')
                ? BahanProduct::findOrFail($request->bahan_id)
                : BahanProduct::firstOrCreate([
                    'nama' => strtoupper(trim($request->bahan_nama))
                ]);

            $kode = $this->generatePesananProductKode(
                $customer->name,
                $customer->phone ?? '',
                $jenis->nama,
                $type->nama ?? null,
                $bahan->nama ?? null,
                $request->ukuran
            );

            $manager = new ImageManager(new Driver());
            $foto = [];

            $folder = '/home/jaym3787/public_html/storage/products';
            if (!file_exists($folder)) mkdir($folder, 0755, true);

            foreach (['foto_depan', 'foto_samping', 'foto_atas'] as $field) {
                if ($request->hasFile($field)) {
                    $image = $manager->read($request->file($field));
                    if ($image->width() > 800) $image->scale(width: 800);

                    $filename = Str::uuid() . '.jpg';
                    $path = $folder . '/' . $filename;

                    file_put_contents($path, (string) $image->toJpeg(85));
                    chmod($path, 0644);

                    $foto[$field] = 'products/' . $filename;
                }
            }

            $product = Product::create([
                'kode' => $kode,
                'customer_id' => $customer->id,
                'jenis_id' => $jenis->id,
                'type_id' => $type->id,
                'bahan_id' => $bahan->id,
                'ukuran' => $request->ukuran,
                'keterangan' => $request->keterangan,
                ...$foto
            ]);

            HargaProduct::create([
                'product_id' => $product->id,
                'customer_id' => $customer->id,
                'harga' => $request->harga,
                'tanggal_berlaku' => now(),
                'keterangan' => 'Harga awal customer'
            ]);

            foreach (Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get() as $place) {
                Inventory::firstOrCreate([
                    'product_id' => $product->id,
                    'place_id' => $place->id
                ], ['qty' => 0]);
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Produk customer berhasil dibuat',
                'data' => $product->load(['jenis', 'type', 'bahan', 'customer'])
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $product = Product::with(['jenis', 'type', 'bahan', 'customer'])->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'jenis_id'   => 'nullable|exists:jenis_products,id',
            'type_id'    => 'nullable|exists:type_products,id',
            'bahan_id'   => 'nullable|exists:bahan_products,id',

            'ukuran' => 'required|string|max:50',
            'keterangan' => 'nullable|string',
            'harga' => 'nullable|integer|min:0',

            'foto_depan'   => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_samping' => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
            'foto_atas'    => 'nullable|image|mimes:jpg,jpeg,png|max:5048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        DB::beginTransaction();

        try {

            /* =============================
           1. UPDATE FOTO
        ============================= */
            $manager = new ImageManager(new Driver());
            $folder = '/home/jaym3787/public_html/storage/products';

            foreach (['foto_depan', 'foto_samping', 'foto_atas'] as $field) {
                if ($request->hasFile($field)) {

                    if ($product->$field) {
                        @unlink('/home/jaym3787/public_html/storage/' . $product->$field);
                    }

                    $image = $manager->read($request->file($field));
                    if ($image->width() > 800) $image->scale(width: 800);

                    $filename = Str::uuid() . '.jpg';
                    $path = $folder . '/' . $filename;

                    file_put_contents($path, (string) $image->toJpeg(85));
                    chmod($path, 0644);

                    $product->$field = 'products/' . $filename;
                }
            }

            /* =============================
           2. AMBIL DATA BARU
        ============================= */
            $ukuranBaru = $request->ukuran;
            $jenisBaru  = $request->jenis_id ?? $product->jenis_id;
            $typeBaru   = $request->type_id ?? $product->type_id;
            $bahanBaru  = $request->bahan_id ?? $product->bahan_id;

            /* =============================
           3. CEK APA ADA PERUBAHAN
        ============================= */
            $isChanged =
                $ukuranBaru !== $product->ukuran ||
                $jenisBaru  != $product->jenis_id ||
                $typeBaru   != $product->type_id ||
                $bahanBaru  != $product->bahan_id;

            /* =============================
           4. REGENERATE KODE JIKA PERLU
        ============================= */
            $kodeBaru = $product->kode;

            if ($isChanged) {
                $jenisNama = JenisProduct::find($jenisBaru)?->nama;
                $typeNama  = TypeProduct::find($typeBaru)?->nama;
                $bahanNama = BahanProduct::find($bahanBaru)?->nama;

                $kodeBaru = $this->generatePesananProductKode(
                    $product->customer->name,
                    $product->customer->phone ?? '',
                    $jenisNama,
                    $typeNama,
                    $bahanNama,
                    $ukuranBaru
                );
            }

            /* =============================
           5. SIMPAN SEMUA PERUBAHAN SEKALIGUS
        ============================= */
            $product->update([
                'jenis_id' => $jenisBaru,
                'type_id'  => $typeBaru,
                'bahan_id' => $bahanBaru,
                'ukuran'   => $ukuranBaru,
                'keterangan' => $request->keterangan,
                'kode' => $kodeBaru,
                'foto_depan' => $product->foto_depan,
                'foto_samping' => $product->foto_samping,
                'foto_atas' => $product->foto_atas,
            ]);

            /* =============================
           6. UPDATE HARGA JIKA BERUBAH
        ============================= */
            if ($request->filled('harga')) {

                $lastHarga = HargaProduct::where('product_id', $product->id)
                    ->where('customer_id', $product->customer_id)
                    ->orderBy('tanggal_berlaku', 'desc')
                    ->first();

                $hargaBaru = (int) $request->harga;
                $hargaLama = $lastHarga?->harga;

                if ($hargaBaru !== $hargaLama) {
                    HargaProduct::create([
                        'product_id' => $product->id,
                        'customer_id' => $product->customer_id,
                        'harga' => $hargaBaru,
                        'tanggal_berlaku' => now(),
                        'keterangan' => 'Update harga'
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Produk berhasil diupdate',
                'data' => $product->load(['jenis', 'type', 'bahan', 'customer'])
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json($e->getMessage(), 500);
        }
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        DB::beginTransaction();

        try {
            foreach (['foto_depan', 'foto_samping', 'foto_atas'] as $f) {
                if ($product->$f) {
                    @unlink('/home/jaym3787/public_html/storage/' . $product->$f);
                }
            }

            $product->delete();

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Produk berhasil dihapus'
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json($e->getMessage(), 500);
        }
    }
}
