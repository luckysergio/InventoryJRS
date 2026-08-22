<?php

namespace App\Services\Transaksi;

use App\Models\BahanProduct;
use App\Models\Customer;
use App\Models\HargaProduct;
use App\Models\Inventory;
use App\Models\JenisProduct;
use App\Models\Place;
use App\Models\Product;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\TypeProduct;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PesananTransaksiService
{
    private const CACHE_LIST_PREFIX = 'pesanan:list:v';
    private const CACHE_VERSION_KEY = 'pesanan:cache:version';
    private const CACHE_VERSION_LOCK = 'pesanan:cache:version:lock';
    private const CACHE_TTL = 300;

    private const STATUS_PROSES = 1;
    private const STATUS_PRODUKSI = 2;
    private const STATUS_QC = 3;
    private const STATUS_SIAP_KIRIM = 4;
    private const STATUS_SELESAI = 5;
    private const STATUS_DIBATALKAN = 6;

    private const ACTIVE_STATUSES = [
        self::STATUS_PROSES,
        self::STATUS_PRODUKSI,
        self::STATUS_QC,
        self::STATUS_SIAP_KIRIM,
    ];

    public function getList(array $filters = [], int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([
            'f'  => $filters,
            'pp' => $perPage,
            'p'  => $page,
        ]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($filters, $perPage, $page) {
            $query = Transaksi::with([
                'customer:id,name,phone',
                'details.product.jenis:id,nama',
                'details.product.type:id,nama',
                'details.product.bahan:id,nama',
                'details.statusTransaksi:id,nama',
                'details.pembayarans:id,transaksi_detail_id,jumlah_bayar,tanggal_bayar',
            ]);

            $mode = $filters['mode'] ?? 'all';
            $search = $filters['search'] ?? null;
            $customerId = $filters['customer_id'] ?? null;
            $dari = $filters['dari'] ?? null;
            $sampai = $filters['sampai'] ?? null;

            $query->where('jenis_transaksi', 'pesanan');

            switch ($mode) {
                case 'aktif':
                    $query->whereHas('details', fn($q) => $q->whereIn('status_transaksi_id', self::ACTIVE_STATUSES));
                    break;
                case 'riwayat':
                    $query->whereHas('details', fn($q) => $q->whereIn('status_transaksi_id', [self::STATUS_SELESAI, self::STATUS_DIBATALKAN]));
                    break;
            }

            $query->when($search, function ($q) use ($search) {
                $q->whereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });

            $query->when($customerId, fn($q) => $q->where('customer_id', $customerId))
                  ->when($dari, fn($q) => $q->whereDate('tanggal', '>=', $dari))
                  ->when($sampai, fn($q) => $q->whereDate('tanggal', '<=', $sampai))
                  ->latest('id');

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function getDetail(int $id): ?Transaksi
    {
        return Transaksi::with([
            'customer:id,name,phone,email',
            'details.product.jenis:id,nama',
            'details.product.type:id,nama',
            'details.product.bahan:id,nama',
            'details.statusTransaksi:id,nama',
            'details.pembayarans',
        ])
        ->where('jenis_transaksi', 'pesanan')
        ->find($id);
    }

    public function create(array $data): Transaksi
    {
        return DB::transaction(function () use ($data) {
            $customer = $this->resolveCustomer($data);
            $details = $this->normalizeDetails($data['details'] ?? []);
            $this->validateDetails($details, $customer);

            $transaksi = Transaksi::create([
                'customer_id'     => $customer->id,
                'jenis_transaksi' => 'pesanan',
                'tanggal'         => $data['tanggal'],
                'total'           => 0,
            ]);

            $totalTransaksi = 0;

            foreach ($details as $d) {
                $product = $this->resolveOrCreateProduct($d, $customer);
                $harga = $this->resolveHargaValue($product->id, $customer->id, $d);

                $qty = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = max(($harga * $qty) - $discount, 0);
                $totalTransaksi += $subtotal;

                TransaksiDetail::create([
                    'transaksi_id'        => $transaksi->id,
                    'product_id'          => $product->id,
                    'status_transaksi_id' => $d['status_transaksi_id'],
                    'qty'                 => $qty,
                    'harga'               => $harga,
                    'subtotal'            => $subtotal,
                    'discount'            => $discount,
                    'catatan'             => $d['catatan'] ?? null,
                ]);
            }

            $transaksi->update(['total' => $totalTransaksi]);

            Log::info('Pesanan created', [
                'id'          => $transaksi->id,
                'customer_id' => $customer->id,
                'total'       => $totalTransaksi,
                'items_count' => count($details),
                'user_id'     => Auth::id(),
            ]);

            $this->invalidateCache();

            return $transaksi->load([
                'customer',
                'details.product.jenis',
                'details.product.type',
                'details.product.bahan',
                'details.statusTransaksi',
                'details.pembayarans',
            ]);
        });
    }

    public function update(Transaksi $transaksi, array $data): Transaksi
    {
        return DB::transaction(function () use ($transaksi, $data) {
            $transaksi->load('details');
            $customer = $this->resolveCustomer($data);
            $details = $this->normalizeDetails($data['details'] ?? []);
            $this->validateDetails($details, $customer);

            $transaksi->update([
                'customer_id' => $customer->id,
                'tanggal'     => $data['tanggal'],
            ]);

            $existingDetailIds = $transaksi->details->pluck('id')->toArray();
            $incomingDetailIds = collect($details)->pluck('id')->filter()->toArray();
            $deletedIds = array_diff($existingDetailIds, $incomingDetailIds);

            foreach ($deletedIds as $detailId) {
                $detail = $transaksi->details->firstWhere('id', $detailId);
                if ($detail) {
                    $detail->update(['status_transaksi_id' => self::STATUS_DIBATALKAN]);
                }
            }

            $totalTransaksi = 0;

            foreach ($details as $d) {
                $product = $this->resolveOrCreateProduct($d, $customer);
                $harga = $this->resolveHargaValue($product->id, $customer->id, $d);

                $qty = $d['qty'];
                $discount = $d['discount'] ?? 0;
                $subtotal = max(($harga * $qty) - $discount, 0);
                $totalTransaksi += $subtotal;

                $isUpdate = !empty($d['id']);

                if ($isUpdate) {
                    $detail = $transaksi->details->firstWhere('id', $d['id']);
                    if ($detail) {
                        $detail->update([
                            'product_id'          => $product->id,
                            'status_transaksi_id' => $d['status_transaksi_id'],
                            'qty'                 => $qty,
                            'harga'               => $harga,
                            'subtotal'            => $subtotal,
                            'discount'            => $discount,
                            'catatan'             => $d['catatan'] ?? null,
                        ]);
                    }
                } else {
                    TransaksiDetail::create([
                        'transaksi_id'        => $transaksi->id,
                        'product_id'          => $product->id,
                        'status_transaksi_id' => $d['status_transaksi_id'],
                        'qty'                 => $qty,
                        'harga'               => $harga,
                        'subtotal'            => $subtotal,
                        'discount'            => $discount,
                        'catatan'             => $d['catatan'] ?? null,
                    ]);
                }
            }

            $transaksi->update(['total' => $totalTransaksi]);

            Log::info('Pesanan updated', [
                'id'      => $transaksi->id,
                'total'   => $totalTransaksi,
                'user_id' => Auth::id(),
            ]);

            $this->invalidateCache();

            return $transaksi->fresh()->load([
                'customer',
                'details.product.jenis',
                'details.product.type',
                'details.product.bahan',
                'details.statusTransaksi',
                'details.pembayarans',
            ]);
        });
    }

    public function updateDetailStatus(TransaksiDetail $detail, int $statusId): TransaksiDetail
    {
        if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
            throw new \Exception('Hanya pesanan yang bisa diubah statusnya.');
        }

        return DB::transaction(function () use ($detail, $statusId) {
            $detail = TransaksiDetail::with('transaksi')->lockForUpdate()->findOrFail($detail->id);
            $oldStatus = $detail->status_transaksi_id;

            $detail->update(['status_transaksi_id' => $statusId]);

            if ($statusId === self::STATUS_DIBATALKAN) {
                $totalBaru = $detail->transaksi->details()
                    ->where('id', '!=', $detail->id)
                    ->whereNotIn('status_transaksi_id', [self::STATUS_DIBATALKAN])
                    ->sum('subtotal');

                $detail->transaksi->update(['total' => $totalBaru]);
            }

            Log::info('PesananDetail status updated', [
                'detail_id'    => $detail->id,
                'transaksi_id' => $detail->transaksi->id,
                'old_status'   => $oldStatus,
                'new_status'   => $statusId,
                'user_id'      => Auth::id(),
            ]);

            $this->invalidateCache();

            return $detail->fresh()->load([
                'transaksi',
                'product.jenis',
                'product.type',
                'product.bahan',
                'statusTransaksi',
                'pembayarans',
            ]);
        });
    }

    public function cancelDetail(TransaksiDetail $detail): void
    {
        if ($detail->transaksi->jenis_transaksi !== 'pesanan') {
            throw new \Exception('Hanya pesanan yang bisa dibatalkan per detail.');
        }

        if (in_array($detail->status_transaksi_id, [self::STATUS_SELESAI, self::STATUS_DIBATALKAN])) {
            throw new \Exception('Detail sudah selesai atau dibatalkan.');
        }

        DB::transaction(function () use ($detail) {
            $detail = TransaksiDetail::with('transaksi')->lockForUpdate()->findOrFail($detail->id);

            $detail->update(['status_transaksi_id' => self::STATUS_DIBATALKAN]);

            $totalBaru = $detail->transaksi->details()
                ->where('id', '!=', $detail->id)
                ->whereNotIn('status_transaksi_id', [self::STATUS_DIBATALKAN])
                ->sum(DB::raw('qty * harga - discount'));

            $detail->transaksi->update(['total' => $totalBaru]);

            Log::info('PesananDetail cancelled', [
                'detail_id'    => $detail->id,
                'transaksi_id' => $detail->transaksi->id,
                'user_id'      => Auth::id(),
            ]);

            $this->invalidateCache();
        });
    }

    public function completeDetail(TransaksiDetail $detail): void
    {
        $detail = TransaksiDetail::with('pembayarans')
            ->whereNotIn('status_transaksi_id', [self::STATUS_SELESAI, self::STATUS_DIBATALKAN])
            ->findOrFail($detail->id);

        $totalBayar = $detail->pembayarans->sum('jumlah_bayar');

        if ($totalBayar < $detail->subtotal) {
            throw ValidationException::withMessages([
                'detail' => "Detail belum lunas. Dibayar: Rp " . number_format($totalBayar) .
                            ", Total: Rp " . number_format($detail->subtotal),
            ]);
        }

        $detail->update(['status_transaksi_id' => self::STATUS_SELESAI]);

        Log::info('PesananDetail completed', [
            'detail_id' => $detail->id,
            'user_id'   => Auth::id(),
        ]);

        $this->invalidateCache();
    }

    public function delete(Transaksi $transaksi): void
    {
        if ($transaksi->jenis_transaksi !== 'pesanan') {
            throw new \Exception('Hanya pesanan yang dapat dihapus.');
        }

        DB::transaction(function () use ($transaksi) {
            $transaksi = Transaksi::with('details')->lockForUpdate()->findOrFail($transaksi->id);

            $transaksiId = $transaksi->id;
            $transaksi->details()->delete();
            $transaksi->delete();

            Log::info('Pesanan deleted', [
                'id'      => $transaksiId,
                'user_id' => Auth::id(),
            ]);

            $this->invalidateCache();
        });
    }

    private function resolveCustomer(array $data): Customer
    {
        if (!empty($data['customer_id'])) {
            return Customer::findOrFail($data['customer_id']);
        }

        if (!empty($data['customer_baru']['name'])) {
            return Customer::firstOrCreate(
                ['name' => trim($data['customer_baru']['name'])],
                [
                    'name'  => trim($data['customer_baru']['name']),
                    'phone' => $data['customer_baru']['phone'] ?? null,
                    'email' => $data['customer_baru']['email'] ?? null,
                ]
            );
        }

        throw ValidationException::withMessages([
            'customer' => 'Customer harus dipilih atau dibuat.',
        ]);
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

    private function validateDetails(array $details, Customer $customer): void
    {
        $errors = [];

        foreach ($details as $idx => $d) {
            if (empty($d['product_id']) && empty($d['product_baru'])) {
                $errors["details.{$idx}.product_id"] = "Produk harus dipilih atau dibuat baru";
                continue;
            }

            if (empty($d['product_id']) && empty($d['product_baru']['ukuran'])) {
                $errors["details.{$idx}.product_baru.ukuran"] = "Ukuran wajib untuk produk baru";
            }

            if (($d['qty'] ?? 0) < 1) {
                $errors["details.{$idx}.qty"] = "Qty harus minimal 1";
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function resolveOrCreateProduct(array $d, Customer $customer): Product
    {
        if (!empty($d['product_id'])) {
            return Product::findOrFail($d['product_id']);
        }

        $pb = $d['product_baru'];

        $jenis = !empty($pb['jenis_id'])
            ? JenisProduct::findOrFail($pb['jenis_id'])
            : JenisProduct::firstOrCreate(['nama' => trim($pb['jenis_nama'])]);

        $type = null;
        if (!empty($pb['type_id']) && is_numeric($pb['type_id'])) {
            $type = TypeProduct::findOrFail($pb['type_id']);
        } elseif (!empty($pb['type_nama'])) {
            $type = TypeProduct::firstOrCreate([
                'nama'     => trim($pb['type_nama']),
                'jenis_id' => $jenis->id,
            ]);
        }

        $bahan = null;
        if (!empty($pb['bahan_id'])) {
            $bahan = BahanProduct::findOrFail($pb['bahan_id']);
        } elseif (!empty($pb['bahan_nama'])) {
            $bahan = BahanProduct::firstOrCreate(['nama' => trim($pb['bahan_nama'])]);
        }

        $product = Product::create([
            'kode'        => $this->makeUniqueKode(
                $this->generatePesananProductKode(
                    $customer->name,
                    $customer->phone,
                    $jenis->nama,
                    $type?->nama ?? '',
                    $bahan?->nama ?? '',
                    $pb['ukuran']
                )
            ),
            'jenis_id'    => $jenis->id,
            'type_id'     => $type?->id,
            'bahan_id'    => $bahan?->id,
            'customer_id' => $customer->id,
            'ukuran'      => $pb['ukuran'],
            'keterangan'  => $pb['keterangan'] ?? null,
        ]);

        $places = Place::whereIn('kode', ['BENGKEL', 'TOKO'])->get();
        foreach ($places as $place) {
            Inventory::firstOrCreate(
                ['product_id' => $product->id, 'place_id' => $place->id],
                ['qty' => 0]
            );
        }

        Log::info('Pesanan product created', [
            'product_id'  => $product->id,
            'kode'        => $product->kode,
            'customer_id' => $customer->id,
        ]);

        return $product;
    }

    private function resolveHargaValue(int $productId, ?int $customerId, array $data): int
    {
        if (!empty($data['harga_baru']['harga'])) {
            HargaProduct::create([
                'product_id'      => $productId,
                'customer_id'     => $customerId,
                'harga'           => $data['harga_baru']['harga'],
                'tanggal_berlaku' => $data['harga_baru']['tanggal_berlaku'] ?? now(),
                'keterangan'      => $data['harga_baru']['keterangan'] ?? 'Harga khusus pesanan',
            ]);

            return (int) $data['harga_baru']['harga'];
        }

        if ($customerId) {
            $hp = HargaProduct::where('product_id', $productId)
                ->where('customer_id', $customerId)
                ->where('tanggal_berlaku', '<=', now())
                ->orderByDesc('tanggal_berlaku')
                ->orderByDesc('id')
                ->first();

            if ($hp) return (int) $hp->harga;
        }

        $hp = HargaProduct::where('product_id', $productId)
            ->whereNull('customer_id')
            ->where('tanggal_berlaku', '<=', now())
            ->orderByDesc('tanggal_berlaku')
            ->orderByDesc('id')
            ->first();

        if (!$hp) {
            throw new \Exception("Harga belum tersedia untuk produk ID {$productId}. Silakan isi harga baru.");
        }

        return (int) $hp->harga;
    }

    private function generateCustomerPrefix(string $customerName, ?string $customerPhone): string
    {
        $initial = collect(preg_split('/\s+/', trim(Str::ascii($customerName))))
            ->map(fn($w) => strtoupper(substr($w, 0, 1)))
            ->filter(fn($c) => ctype_alpha($c))
            ->take(4)
            ->implode('');

        $hp = preg_replace('/\D/', '', $customerPhone ?? '');
        $last4 = substr($hp ?: '0000', -4);

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
        $words = collect(preg_split('/\s+/', trim($clean)))
            ->filter(fn($w) => ctype_alpha(substr($w, 0, 1)));

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

    private function extractInitials(?string $text, int $max = 2): string
    {
        if (!$text) return '';
        return collect(preg_split('/\s+/', trim(Str::ascii($text))))
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

    private function generateBaseProductKode(string $jenisNama, ?string $typeNama, ?string $bahanNama, string $ukuran): string
    {
        return strtoupper(
            $this->jenisKode($jenisNama) .
            ($typeNama ? $this->typeKode($typeNama) : '') .
            ($bahanNama ? $this->extractInitials($bahanNama, 2) : '') .
            $this->extractNumbers($ukuran)
        );
    }

    private function generatePesananProductKode(
        string $customerName,
        ?string $customerPhone,
        string $jenisNama,
        ?string $typeNama,
        ?string $bahanNama,
        string $ukuran
    ): string {
        $prefix = $this->generateCustomerPrefix($customerName, $customerPhone);
        $baseKode = $this->generateBaseProductKode($jenisNama, $typeNama, $bahanNama, $ukuran);
        return "{$prefix}-{$baseKode}";
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

    public function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    public function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 10);

        try {
            $lock->block(5, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

                Log::info('Pesanan cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Pesanan cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}