<?php

namespace App\Services\Customer;

use App\Models\Customer;
use App\Models\Product;
use App\Models\TransaksiDetail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CustomerService
{
    private const CACHE_LIST_PREFIX = 'customers:list:v';
    private const CACHE_DETAIL_PREFIX = 'customers:detail:v';
    private const CACHE_DROPDOWN_KEY = 'customers:dropdown:v';
    private const CACHE_TAGIHAN_PREFIX = 'customers:tagihan:v';

    private const CACHE_VERSION_KEY = 'customers:cache:version';
    private const CACHE_VERSION_LOCK = 'customers:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_DROPDOWN = 7200;
    private const CACHE_TTL_TAGIHAN = 300;

    private const STATUS_DIBATALKAN = 6;

    public function getList(?string $search = null, int $perPage = 20, int $page = 1): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $perPage, $page);

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $perPage, $page) {
            $statusDibatalkan = DB::table('status_transaksis')->where('nama', 'Dibatalkan')->value('id');

            $pembayaranSubquery = DB::table('pembayarans')
                ->select('transaksi_detail_id', DB::raw('SUM(jumlah_bayar) as total_bayar'))
                ->groupBy('transaksi_detail_id');

            $tagihanHarian = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->leftJoinSub($pembayaranSubquery, 'p', fn($join) => $join->on('td.id', '=', 'p.transaksi_detail_id'))
                ->where('t.jenis_transaksi', 'daily')
                ->whereRaw('t.customer_id = customers.id')
                ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
                ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
                ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

            $tagihanPesanan = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->leftJoinSub($pembayaranSubquery, 'p', fn($join) => $join->on('td.id', '=', 'p.transaksi_detail_id'))
                ->where('t.jenis_transaksi', 'pesanan')
                ->whereRaw('t.customer_id = customers.id')
                ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
                ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
                ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

            $query = Customer::select(['customers.id', 'customers.name', 'customers.phone', 'customers.email', 'customers.created_at', 'customers.updated_at'])
                ->addSelect([
                    'tagihan_harian_belum_lunas' => $tagihanHarian,
                    'tagihan_pesanan_belum_lunas' => $tagihanPesanan,
                ])
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('customers.name', 'like', "%{$search}%")
                            ->orWhere('customers.phone', 'like', "%{$search}%")
                            ->orWhere('customers.email', 'like', "%{$search}%");
                    });
                })
                ->orderBy('customers.name', 'asc');

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        $items = collect($paginator->items())->map(function ($customer) {
            $arr = $customer->toArray();
            $arr['tagihan_harian_belum_lunas'] = (float) max(0, $arr['tagihan_harian_belum_lunas'] ?? 0);
            $arr['tagihan_pesanan_belum_lunas'] = (float) max(0, $arr['tagihan_pesanan_belum_lunas'] ?? 0);
            $arr['total_tagihan'] = $arr['tagihan_harian_belum_lunas'] + $arr['tagihan_pesanan_belum_lunas'];
            $arr['has_outstanding'] = $arr['total_tagihan'] > 0;
            return $arr;
        });

        return [
            'data' => $items,
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

    public function getDetail(int $id): ?array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id) {
            $statusDibatalkan = DB::table('status_transaksis')->where('nama', 'Dibatalkan')->value('id');

            $pembayaranSubquery = DB::table('pembayarans')
                ->select('transaksi_detail_id', DB::raw('SUM(jumlah_bayar) as total_bayar'))
                ->groupBy('transaksi_detail_id');

            $tagihanHarian = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->leftJoinSub($pembayaranSubquery, 'p', fn($join) => $join->on('td.id', '=', 'p.transaksi_detail_id'))
                ->where('t.jenis_transaksi', 'daily')
                ->whereRaw('t.customer_id = customers.id')
                ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
                ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
                ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

            $tagihanPesanan = DB::table('transaksi_details as td')
                ->join('transaksis as t', 'td.transaksi_id', '=', 't.id')
                ->leftJoinSub($pembayaranSubquery, 'p', fn($join) => $join->on('td.id', '=', 'p.transaksi_detail_id'))
                ->where('t.jenis_transaksi', 'pesanan')
                ->whereRaw('t.customer_id = customers.id')
                ->when($statusDibatalkan, fn($q) => $q->where('td.status_transaksi_id', '!=', $statusDibatalkan))
                ->whereRaw('COALESCE(p.total_bayar, 0) < td.subtotal')
                ->selectRaw('COALESCE(SUM(td.subtotal - COALESCE(p.total_bayar, 0)), 0)');

            $customer = Customer::select(['customers.id', 'customers.name', 'customers.phone', 'customers.email', 'customers.created_at', 'customers.updated_at'])
                ->addSelect([
                    'tagihan_harian_belum_lunas' => $tagihanHarian,
                    'tagihan_pesanan_belum_lunas' => $tagihanPesanan,
                ])
                ->find($id);

            if (!$customer) return null;

            $arr = $customer->toArray();
            $arr['tagihan_harian_belum_lunas'] = (float) max(0, $arr['tagihan_harian_belum_lunas'] ?? 0);
            $arr['tagihan_pesanan_belum_lunas'] = (float) max(0, $arr['tagihan_pesanan_belum_lunas'] ?? 0);
            $arr['total_tagihan'] = $arr['tagihan_harian_belum_lunas'] + $arr['tagihan_pesanan_belum_lunas'];
            $arr['has_outstanding'] = $arr['total_tagihan'] > 0;

            return $arr;
        });
    }

    /**
     * ✅ ROBUST VERSION: Get detail tagihan customer (transaksi_details yang belum lunas).
     * 
     * Perubahan utama dari versi sebelumnya:
     * 1. HAPUS select specific columns (hindari "Column not found" error)
     * 2. Biarkan model handle serialization (lebih flexible)
     * 3. Tambah error handling per-item mapping
     * 
     * @param int $customerId
     * @param string|null $jenis Filter: 'daily' | 'pesanan' | null (semua)
     * @return array{details: array, summary: array}
     */
    public function getTagihan(int $customerId, ?string $jenis = null): array
    {
        $version = $this->getCacheVersion();
        $jenisKey = $jenis ?: 'all';
        $cacheKey = self::CACHE_TAGIHAN_PREFIX . "{$version}:c{$customerId}:j{$jenisKey}";

        return Cache::remember($cacheKey, self::CACHE_TTL_TAGIHAN, function () use ($customerId, $jenis) {
            // ✅ ROBUST: Tanpa select specific columns
            // Eager load semua field, biarkan model handle serialization
            $query = TransaksiDetail::with([
                'transaksi',
                'product.jenis',
                'product.type',
                'product.bahan',
                'pembayarans',
            ])
                ->whereHas('transaksi', function ($q) use ($customerId, $jenis) {
                    $q->where('customer_id', $customerId);
                    if ($jenis && in_array($jenis, ['daily', 'pesanan'], true)) {
                        $q->where('jenis_transaksi', $jenis);
                    }
                })
                ->where('status_transaksi_id', '!=', self::STATUS_DIBATALKAN)
                ->orderBy('id', 'desc'); // ✅ Sederhana, tanpa prefix tabel

            $details = $query->get()->map(function ($detail) {
                try {
                    $subtotal = (float) ($detail->subtotal ?? 0);
                    $totalBayar = (float) $detail->pembayarans->sum('jumlah_bayar');
                    $sisaTagihan = max($subtotal - $totalBayar, 0);

                    // ✅ Manual serialization untuk hindari error pada field yang tidak ada
                    $transaksiData = null;
                    if ($detail->transaksi) {
                        $transaksiData = [
                            'id'              => $detail->transaksi->id,
                            'jenis_transaksi' => $detail->transaksi->jenis_transaksi,
                            'tanggal'         => $detail->transaksi->tanggal,
                            'kode'            => $detail->transaksi->kode ?? null,
                            'customer_id'     => $detail->transaksi->customer_id,
                        ];
                    }

                    // ✅ Safe access untuk product (handle jika relasi tidak ada)
                    $productData = null;
                    if ($detail->product) {
                        $productData = [
                            'id'       => $detail->product->id,
                            'kode'     => $detail->product->kode ?? null,
                            'nama'     => $detail->product->nama ?? null,
                            'ukuran'   => $detail->product->ukuran ?? null,
                            'jenis'    => $detail->product->jenis ? [
                                'id' => $detail->product->jenis->id,
                                'nama' => $detail->product->jenis->nama,
                            ] : null,
                            'type'     => $detail->product->type ? [
                                'id' => $detail->product->type->id,
                                'nama' => $detail->product->type->nama,
                            ] : null,
                            'bahan'    => $detail->product->bahan ? [
                                'id' => $detail->product->bahan->id,
                                'nama' => $detail->product->bahan->nama,
                            ] : null,
                        ];
                    }

                    // ✅ Safe access untuk pembayarans
                    $pembayaransData = $detail->pembayarans->map(function ($p) {
                        return [
                            'id'                  => $p->id,
                            'transaksi_detail_id' => $p->transaksi_detail_id,
                            'jumlah_bayar'        => (float) ($p->jumlah_bayar ?? 0),
                            'tanggal_bayar'       => $p->tanggal_bayar,
                        ];
                    })->toArray();

                    return [
                        'id'                  => $detail->id,
                        'transaksi_id'        => $detail->transaksi_id,
                        'product_id'          => $detail->product_id,
                        'qty'                 => (int) ($detail->qty ?? 0),
                        'harga'               => (float) ($detail->harga ?? 0),
                        'subtotal'            => $subtotal,
                        'discount'            => (float) ($detail->discount ?? 0),
                        'catatan'             => $detail->catatan,
                        'status_transaksi_id' => (int) $detail->status_transaksi_id,
                        'total_bayar'         => $totalBayar,
                        'sisa_tagihan'        => $sisaTagihan,
                        'transaksi'           => $transaksiData,
                        'product'             => $productData,
                        'pembayarans'         => $pembayaransData,
                    ];
                } catch (\Throwable $e) {
                    // ✅ Log warning tapi lanjutkan ke item berikutnya
                    Log::warning('Error mapping transaksi detail', [
                        'detail_id' => $detail->id ?? null,
                        'error' => $e->getMessage(),
                    ]);
                    return null;
                }
            })->filter(); // Hapus item yang null (error)

            // Filter hanya yang BELUM LUNAS
            $unpaidDetails = $details->filter(fn($d) => ($d['sisa_tagihan'] ?? 0) > 0)->values();

            // Summary
            $totalTagihan = (float) $unpaidDetails->sum('sisa_tagihan');
            $totalSudahBayar = (float) $unpaidDetails->sum('total_bayar');
            $jumlahItem = $unpaidDetails->count();

            return [
                'details' => $unpaidDetails->toArray(),
                'summary' => [
                    'total_tagihan'     => $totalTagihan,
                    'total_sudah_bayar' => $totalSudahBayar,
                    'jumlah_item'       => $jumlahItem,
                ],
            ];
        });
    }

    public function getForDropdown(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DROPDOWN_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL_DROPDOWN, function () {
            return Customer::select(['id', 'name', 'phone'])
                ->orderBy('name', 'asc')
                ->get()
                ->map(fn($c) => [
                    'value' => $c->id,
                    'label' => $c->name . ($c->phone ? " ({$c->phone})" : ''),
                ])
                ->toArray();
        });
    }

    public function create(array $data): Customer
    {
        return DB::transaction(function () use ($data) {
            $customer = Customer::create([
                'name'  => $data['name'],
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
            ]);

            Log::info('Customer created', [
                'id' => $customer->id,
                'name' => $customer->name,
            ]);

            return $customer;
        });
    }

    public function update(Customer $customer, array $data): Customer
    {
        return DB::transaction(function () use ($customer, $data) {
            if (!$customer->exists) {
                throw new \Exception("Gagal update: Data customer tidak valid.");
            }

            $customer->update([
                'name'  => $data['name'],
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
            ]);

            Log::info('Customer updated', [
                'id' => $customer->id,
                'name' => $customer->name,
            ]);

            return $customer->fresh();
        });
    }

    public function delete(Customer $customer): array
    {
        $id = $customer->id;
        $name = $customer->name;

        if (!$id || !$customer->exists) {
            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data customer tidak valid.',
            ];
        }

        $hasProduct = Product::where('customer_id', $id)->exists();
        if ($hasProduct) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Customer '{$name}' tidak dapat dihapus karena masih memiliki product.",
            ];
        }

        $hasTransaksi = DB::table('transaksis')->where('customer_id', $id)->exists();
        if ($hasTransaksi) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Customer '{$name}' tidak dapat dihapus karena masih memiliki riwayat transaksi.",
            ];
        }

        DB::transaction(function () use ($customer) {
            $customer->delete();
        });

        Log::info('Customer deleted', ['id' => $id, 'name' => $name]);

        return [
            'success' => true,
            'message' => "Customer '{$name}' berhasil dihapus.",
        ];
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

                Log::info('Customer cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Customer cache invalidation fallback used', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildListCacheKey(int $version, ?string $search, int $perPage, int $page): string
    {
        $searchKey = $search ? md5($search) : 'all';
        return self::CACHE_LIST_PREFIX . "{$version}:{$searchKey}:{$perPage}:{$page}";
    }
}