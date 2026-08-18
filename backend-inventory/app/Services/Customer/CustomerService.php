<?php

namespace App\Services\Customer;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CustomerService
{
    private const CACHE_LIST_PREFIX = 'customers:list:v';
    private const CACHE_DETAIL_PREFIX = 'customers:detail:v';
    private const CACHE_DROPDOWN_KEY = 'customers:dropdown:v';

    private const CACHE_VERSION_KEY = 'customers:cache:version';
    private const CACHE_VERSION_LOCK = 'customers:cache:version:lock';

    private const CACHE_TTL_LIST = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_TTL_DROPDOWN = 7200;

    /**
     * Get paginated customer list with tagihan calculation.
     *
     * @return array{data: array, meta: array}
     */
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

        // Transform setelah cache (ringan, hanya mapping)
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

    /**
     * Get customer detail by ID.
     *
     * @return array<string, mixed>|null
     */
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
     * Lightweight dropdown data.
     *
     * @return array<int, array{value: int, label: string}>
     */
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

    /**
     * Delete customer with relation protection.
     *
     * @return array{success: bool, code?: int, message: string}
     */
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