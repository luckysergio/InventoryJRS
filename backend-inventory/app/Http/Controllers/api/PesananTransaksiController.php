<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanProduct;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Customer;
use App\Models\Product;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\TypeProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class PesananTransaksiController extends Controller
{
    public function index()
    {
        $data = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.statusTransaksi',
            'details.pembayarans',
        ])
            ->where('jenis_transaksi', 'pesanan')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }

    public function aktif(Request $request)
    {
        $query = Transaksi::with([
            'customer',
            'details' => function ($q) {
                $q->whereIn('status_transaksi_id', [2, 3, 4])
                    ->with([
                        'product.jenis',
                        'product.type',
                        'product.bahan',
                        'statusTransaksi',
                        'pembayarans',
                    ]);
            }
        ])
            ->where('jenis_transaksi', 'pesanan')
            ->whereHas('details', function ($q) {
                $q->whereIn('status_transaksi_id', [2, 3, 4]);
            });

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->whereHas('customer', function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm);
            });
        }

        $data = $query->orderByDesc('id')->get();

        return response()->json($data);
    }

    public function show($id)
    {
        $data = Transaksi::with([
            'customer',
            'details.product.jenis',
            'details.product.type',
            'details.product.bahan',
            'details.pembayarans'
        ])
            ->where('jenis_transaksi', 'pesanan')
            ->findOrFail($id);

        return response()->json($data);
    }

    private function extractInitials(?string $text, int $max = 2): string
    {
        if (!$text) return '';

        $words = preg_split('/\s+/', trim(Str::ascii($text)));

        return collect($words)
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

    private function generateCustomerPrefix(string $customerName, int $max = 6): string
    {
        $letters = collect(
            preg_split('/\s+/', trim(Str::ascii($customerName)))
        )
            ->map(fn($word) => strtoupper(substr($word, 0, 1)))
            ->filter(fn($char) => ctype_alpha($char))
            ->implode('');

        $letters = substr($letters, 0, $max);

        return $letters . '-';
    }

    private function makeUniqueKode(string $baseKode): string
    {
        $kode = $baseKode;
        $i = 1;

        while (Product::where('kode', $kode)->exists()) {
            $kode = "{$baseKode}_{$i}";
            $i++;
        }

        return $kode;
    }

    private function generatePesananProductKode(
        string $customerName,
        string $jenisNama,
        ?string $typeNama,
        ?string $bahanNama,
        string $ukuran
    ): string {
        $customerPrefix = $this->generateCustomerPrefix($customerName);

        $jenisKode = strtoupper(substr($jenisNama, 0, 1));

        $typeKode = $typeNama
            ? $this->extractInitials($typeNama, 2) . $this->extractNumbers($typeNama)
            : '';

        $bahanKode = $this->extractInitials($bahanNama, 2);

        $ukuranKode = $this->extractNumbers($ukuran);

        return $customerPrefix
            . $jenisKode
            . $typeKode
            . $bahanKode
            . $ukuranKode;
    }

    private function normalizeDetails(array $details): array
    {
        return collect($details)->map(function ($detail) {
            if (($detail['product_id'] ?? null) === 'new') {
                $detail['product_id'] = null;
            }

            if (isset($detail['product_baru']) && is_array($detail['product_baru'])) {
                foreach (['jenis_id', 'type_id', 'bahan_id'] as $field) {
                    if (($detail['product_baru'][$field] ?? null) === 'new') {
                        $detail['product_baru'][$field] = null;
                    }
                }
            }

            return $detail;
        })->toArray();
    }

    public function store(Request $request)
    {
        $request->merge([
            'details' => $this->normalizeDetails($request->input('details', []))
        ]);

        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'customer_baru.name' => 'required_without:customer_id|string',

            'details' => 'required|array|min:1',
            'details.*.product_id' => 'nullable|exists:products,id',

            'details.*.product_baru.jenis_id' => 'nullable|exists:jenis_products,id',
            'details.*.product_baru.jenis_nama' => 'nullable|string',

            'details.*.product_baru.type_id' => 'nullable',
            'details.*.product_baru.type_nama' => 'nullable|string',

            'details.*.product_baru.bahan_id' => 'nullable|exists:bahan_products,id',
            'details.*.product_baru.bahan_nama' => 'nullable|string',

            'details.*.product_baru.ukuran' => 'required_if:details.*.product_id,null',

            'details.*.qty' => 'required|integer|min:1',
            'details.*.tanggal' => 'required|date',
            'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',

            'details.*.harga_baru.harga' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $customer = $request->customer_id
                ? Customer::findOrFail($request->customer_id)
                : Customer::create($request->customer_baru);

            $transaksi = Transaksi::create([
                'customer_id' => $customer->id,
                'jenis_transaksi' => 'pesanan',
                'total' => 0
            ]);

            $places = Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get();
            $total = 0;

            foreach ($request->details as $d) {

                if (!empty($d['product_id'])) {
                    $product = Product::findOrFail($d['product_id']);
                } else {

                    if (!empty($d['product_baru']['jenis_id'])) {
                        $jenis = JenisProduct::findOrFail($d['product_baru']['jenis_id']);
                    } else {
                        $jenis = JenisProduct::create([
                            'nama' => trim($d['product_baru']['jenis_nama'])
                        ]);
                    }

                    $jenis->refresh();

                    $type = null;

                    if (
                        isset($d['product_baru']['type_id']) &&
                        is_numeric($d['product_baru']['type_id'])
                    ) {
                        $type = TypeProduct::findOrFail($d['product_baru']['type_id']);
                    } elseif (
                        isset($d['product_baru']['type_nama']) &&
                        trim($d['product_baru']['type_nama']) !== ''
                    ) {
                        $type = TypeProduct::create([
                            'nama' => trim($d['product_baru']['type_nama']),
                            'jenis_id' => $jenis->id
                        ]);
                    }

                    if (!empty($d['product_baru']['bahan_id'])) {
                        $bahan = BahanProduct::findOrFail($d['product_baru']['bahan_id']);
                    } elseif (!empty($d['product_baru']['bahan_nama'])) {
                        $bahan = BahanProduct::firstOrCreate([
                            'nama' => trim($d['product_baru']['bahan_nama'])
                        ]);
                    } else {
                        $bahan = null;
                    }

                    $product = Product::create([
                        'kode' => $this->makeUniqueKode(
                            $this->generatePesananProductKode(
                                $customer->name,
                                $jenis->nama,
                                $type?->nama ?? '',
                                $bahan?->nama ?? '',
                                $d['product_baru']['ukuran']
                            )
                        ),
                        'jenis_id' => $jenis->id,
                        'type_id' => $type?->id,
                        'bahan_id' => $bahan?->id,
                        'ukuran' => $d['product_baru']['ukuran'],
                        'keterangan' => $d['product_baru']['keterangan'] ?? null,
                    ]);

                    foreach ($places as $place) {
                        Inventory::firstOrCreate(
                            [
                                'product_id' => $product->id,
                                'place_id' => $place->id
                            ],
                            ['qty' => 0]
                        );
                    }
                }

                if (!empty($d['harga_baru']['harga'])) {
                    $harga = HargaProduct::create([
                        'product_id' => $product->id,
                        'customer_id' => $customer->id,
                        'harga' => $d['harga_baru']['harga'],
                        'tanggal_berlaku' => now(),
                        'keterangan' => $d['harga_baru']['keterangan'] ?? 'Harga khusus'
                    ]);
                } else {
                    $harga = HargaProduct::where('product_id', $product->id)
                        ->where(function ($q) use ($customer) {
                            $q->where('customer_id', $customer->id)
                                ->orWhereNull('customer_id');
                        })
                        ->latest('tanggal_berlaku')
                        ->first();

                    if (!$harga) {
                        throw new \Exception("Harga belum tersedia untuk produk {$product->kode}");
                    }
                }

                $subtotal = $harga->harga * $d['qty'];
                $total += $subtotal;

                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'product_id' => $product->id,
                    'harga_product_id' => $harga->id,
                    'status_transaksi_id' => $d['status_transaksi_id'],
                    'tanggal' => $d['tanggal'],
                    'qty' => $d['qty'],
                    'harga' => $harga->harga,
                    'subtotal' => $subtotal,
                ]);
            }

            $transaksi->update(['total' => $total]);
            DB::commit();

            return response()->json([
                'message' => 'Pesanan berhasil dibuat',
                'transaksi_id' => $transaksi->id
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membuat pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->merge([
            'details' => $this->normalizeDetails($request->input('details', []))
        ]);

        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|exists:customers,id',
            'customer_baru.name' => 'required_without:customer_id|string',

            'details' => 'required|array|min:1',
            'details.*.id' => 'nullable|exists:transaksi_details,id',
            'details.*.product_id' => 'nullable|exists:products,id',

            'details.*.product_baru.jenis_id' => 'nullable|exists:jenis_products,id',
            'details.*.product_baru.jenis_nama' => 'nullable|string',

            'details.*.product_baru.type_id' => 'nullable',
            'details.*.product_baru.type_nama' => 'nullable|string',

            'details.*.product_baru.bahan_id' => 'nullable|exists:bahan_products,id',
            'details.*.product_baru.bahan_nama' => 'nullable|string',

            'details.*.product_baru.ukuran' => 'required_if:details.*.product_id,null',

            'details.*.qty' => 'required|integer|min:1',
            'details.*.tanggal' => 'required|date',
            'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',

            'details.*.harga_baru.harga' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $transaksi = Transaksi::with('details')->findOrFail($id);

            $customer = $request->customer_id
                ? Customer::findOrFail($request->customer_id)
                : Customer::firstOrCreate(
                    ['name' => $request->customer_baru['name']],
                    $request->customer_baru
                );

            $transaksi->update([
                'customer_id' => $customer->id
            ]);

            $total = 0;
            $existingDetailIds = [];

            foreach ($request->details as $d) {
                if (!empty($d['product_id'])) {
                    $product = Product::findOrFail($d['product_id']);
                } else {
                    $jenis = !empty($d['product_baru']['jenis_id'])
                        ? JenisProduct::findOrFail($d['product_baru']['jenis_id'])
                        : JenisProduct::firstOrCreate([
                            'nama' => $d['product_baru']['jenis_nama']
                        ]);

                    if (!empty($d['product_baru']['type_id']) && is_numeric($d['product_baru']['type_id'])) {
                        $type = TypeProduct::findOrFail($d['product_baru']['type_id']);
                    } elseif (!empty($d['product_baru']['type_nama'])) {
                        $type = TypeProduct::firstOrCreate([
                            'nama' => $d['product_baru']['type_nama'],
                            'jenis_id' => $jenis->id
                        ]);
                    } else {
                        $type = null;
                    }

                    if (!empty($d['product_baru']['bahan_id'])) {
                        $bahan = BahanProduct::findOrFail($d['product_baru']['bahan_id']);
                    } elseif (!empty($d['product_baru']['bahan_nama'])) {
                        $bahan = BahanProduct::firstOrCreate([
                            'nama' => $d['product_baru']['bahan_nama']
                        ]);
                    } else {
                        $bahan = null;
                    }

                    $product = Product::create([
                        'kode' => $this->makeUniqueKode(
                            $this->generatePesananProductKode(
                                $customer->name,
                                $jenis->nama,
                                $type?->nama ?? '',
                                $bahan?->nama ?? '',
                                $d['product_baru']['ukuran']
                            )
                        ),
                        'jenis_id' => $jenis->id,
                        'type_id' => $type?->id,
                        'bahan_id' => $bahan?->id,
                        'ukuran' => $d['product_baru']['ukuran'],
                        'keterangan' => $d['product_baru']['keterangan'] ?? null,
                    ]);
                }

                if (!empty($d['harga_baru']['harga'])) {
                    $harga = HargaProduct::create([
                        'product_id' => $product->id,
                        'customer_id' => $customer->id,
                        'harga' => $d['harga_baru']['harga'],
                        'tanggal_berlaku' => now(),
                        'keterangan' => $d['harga_baru']['keterangan'] ?? 'Harga khusus'
                    ]);
                } else {
                    $harga = HargaProduct::where('product_id', $product->id)
                        ->where(function ($q) use ($customer) {
                            $q->where('customer_id', $customer->id)
                                ->orWhereNull('customer_id');
                        })
                        ->latest('tanggal_berlaku')
                        ->first();

                    if (!$harga) {
                        throw new \Exception("Harga belum tersedia");
                    }
                }

                $subtotal = $harga->harga * $d['qty'];
                $total += $subtotal;

                $detail = TransaksiDetail::updateOrCreate(
                    [
                        'id' => $d['id'] ?? null,
                        'transaksi_id' => $transaksi->id
                    ],
                    [
                        'product_id' => $product->id,
                        'harga_product_id' => $harga->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'tanggal' => $d['tanggal'],
                        'qty' => $d['qty'],
                        'harga' => $harga->harga,
                        'subtotal' => $subtotal,
                    ]
                );

                $existingDetailIds[] = $detail->id;
            }

            $transaksi->details()
                ->whereNotIn('id', $existingDetailIds)
                ->delete();

            $transaksi->update(['total' => $total]);

            DB::commit();

            return response()->json([
                'message' => 'Pesanan berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memperbarui pesanan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cancel($id)
    {
        $transaksi = Transaksi::where('jenis_transaksi', 'pesanan')->findOrFail($id);

        DB::transaction(function () use ($transaksi) {
            $transaksi->details()
                ->whereNotIn('status_transaksi_id', [5, 6])
                ->update(['status_transaksi_id' => 6]);
        });

        return response()->json(['message' => 'Pesanan dibatalkan']);
    }

    public function selesai($detailId)
    {
        $detail = TransaksiDetail::with('pembayarans')
            ->whereNotIn('status_transaksi_id', [5, 6])
            ->findOrFail($detailId);

        $totalBayar = $detail->pembayarans->sum('jumlah_bayar');

        if ($totalBayar < $detail->subtotal) {
            return response()->json([
                'message' => 'Detail belum lunas'
            ], 422);
        }

        $detail->update([
            'status_transaksi_id' => 5 // Selesai
        ]);

        return response()->json([
            'message' => 'Detail berhasil diselesaikan'
        ]);
    }
}
