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

        if (strlen($jenis) < 2) {
            return $jenis;
        }

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
            $huruf = $words
                ->map(fn($w) => substr($w, 0, 1))
                ->implode('');
        }

        preg_match_all('/\d+/', $text, $matches);

        if (count($matches[0]) >= 2) {
            $angka = $matches[0][0] . $matches[0][1];
        } else {
            $angka = $matches[0][0] ?? '';
        }

        return strtoupper($huruf . $angka);
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
                ($bahanNama ? $this->extractInitials($bahanNama, 2) : '') .
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
        $prefix = $this->generateCustomerPrefix(
            $customerName,
            $customerPhone
        );

        $baseKode = $this->generateBaseProductKode(
            $jenisNama,
            $typeNama,
            $bahanNama,
            $ukuran
        );

        return $this->makeUniqueKode("{$prefix}-{$baseKode}");
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

        $validator = Validator::make(
            $request->all(),
            [
                'customer_id' => 'nullable|exists:customers,id',
                'customer_baru.name' => 'required_without:customer_id|string',
                'tanggal' => 'required|date',

                'details' => 'required|array|min:1',
                'details.*.product_id' => 'nullable|exists:products,id',

                'details.*.product_baru.jenis_id' => 'nullable|exists:jenis_products,id',
                'details.*.product_baru.jenis_nama' => [
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],

                'details.*.product_baru.type_id' => 'nullable',
                'details.*.product_baru.type_nama' => [
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],

                'details.*.product_baru.bahan_id' => 'nullable|exists:bahan_products,id',
                'details.*.product_baru.bahan_nama' => [
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],

                'details.*.product_baru.ukuran' => 'required_if:details.*.product_id,null',

                'details.*.qty' => 'required|integer|min:1',
                'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',

                'details.*.harga_baru.harga' => 'nullable|integer|min:0',
            ],
            [
                'jenis_nama.regex' => 'Nama jenis harus HURUF KAPITAL',
                'type_nama.regex'  => 'Nama type harus HURUF KAPITAL',
                'bahan_nama.regex' => 'Nama bahan harus HURUF KAPITAL',
            ]
        );

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

            $tanggal = $request->tanggal;
            $transaksi = Transaksi::create([
                'customer_id' => $customer->id,
                'jenis_transaksi' => 'pesanan',
                'tanggal' => $tanggal,
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
                                $customer->phone,
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

        $validator = Validator::make(
            $request->all(),
            [
                'customer_id' => 'nullable|exists:customers,id',
                'customer_baru.name' => 'required_without:customer_id|string',
                'tanggal' => 'required|date',

                'details' => 'required|array|min:1',
                'details.*.id' => 'nullable|exists:transaksi_details,id',
                'details.*.product_id' => 'nullable|exists:products,id',

                'details.*.product_baru.jenis_id' => 'nullable|exists:jenis_products,id',
                'details.*.product_baru.jenis_nama' => [
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],

                'details.*.product_baru.type_id' => 'nullable',
                'details.*.product_baru.type_nama' => [
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],

                'details.*.product_baru.bahan_id' => 'nullable|exists:bahan_products,id',
                'details.*.product_baru.bahan_nama' => [
                    'string',
                    'max:100',
                    'regex:/^[A-Z0-9\s]+$/'
                ],

                'details.*.product_baru.ukuran' => 'required_if:details.*.product_id,null',

                'details.*.qty' => 'required|integer|min:1',
                'details.*.status_transaksi_id' => 'required|exists:status_transaksis,id',

                'details.*.harga_baru.harga' => 'nullable|integer|min:0',
            ],
            [
                'jenis_nama.regex' => 'Nama jenis harus HURUF KAPITAL',
                'type_nama.regex'  => 'Nama type harus HURUF KAPITAL',
                'bahan_nama.regex' => 'Nama bahan harus HURUF KAPITAL',
            ]
        );

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
                'customer_id' => $customer->id,
                'tanggal' => $request->tanggal,
            ]);

            $placeToko = Place::where('kode', 'TOKO')->first();
            if (!$placeToko) {
                throw new \Exception("Place 'TOKO' tidak ditemukan");
            }

            $existingDetailIds = [];

            foreach ($request->details as $d) {
                $isNewProduct = empty($d['product_id']); // ✅ Deteksi product baru

                if (!$isNewProduct) {
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
                                $customer->phone,
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

                    Inventory::create([
                        'product_id' => $product->id,
                        'place_id' => $placeToko->id,
                        'qty' => 0, // Mulai dari 0, nanti diisi saat produksi
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

                $detail = TransaksiDetail::updateOrCreate(
                    [
                        'id' => $d['id'] ?? null,
                        'transaksi_id' => $transaksi->id
                    ],
                    [
                        'product_id' => $product->id,
                        'harga_product_id' => $harga->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'qty' => $d['qty'],
                        'harga' => $harga->harga,
                        'subtotal' => $subtotal,
                    ]
                );

                $existingDetailIds[] = $detail->id;
            }

            // Hapus detail yang tidak dikirim
            $transaksi->details()
                ->whereNotIn('id', $existingDetailIds)
                ->delete();

            // Hitung ulang total (abaikan status 5 & 6)
            $total = $transaksi->details()
                ->whereNotIn('status_transaksi_id', [5, 6])
                ->sum(DB::raw('qty * harga'));

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

    public function cancel($detailId)
    {
        $detail = TransaksiDetail::with('transaksi')->findOrFail($detailId);

        if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
            return response()->json(['message' => 'Transaksi bukan pesanan'], 400);
        }

        if (in_array($detail->status_transaksi_id, [5, 6])) {
            return response()->json(['message' => 'Detail sudah selesai atau dibatalkan'], 400);
        }

        DB::transaction(function () use ($detail) {
            $detail->update(['status_transaksi_id' => 6]);

            // ✅ PERBARUI TOTAL TRANSAKSI SETELAH PEMBATALAN
            $transaksi = $detail->transaksi;
            $total = $transaksi->details()
                ->whereNotIn('status_transaksi_id', [5, 6])
                ->sum(DB::raw('qty * harga'));
            $transaksi->update(['total' => $total]);
        });

        return response()->json(['message' => 'Detail pesanan dibatalkan']);
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
            'status_transaksi_id' => 5
        ]);

        return response()->json([
            'message' => 'Detail berhasil diselesaikan'
        ]);
    }
}
