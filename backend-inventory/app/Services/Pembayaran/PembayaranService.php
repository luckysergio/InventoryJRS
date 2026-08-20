<?php

namespace App\Services\Pembayaran;

use App\Models\Pembayaran;
use App\Models\TransaksiDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PembayaranService
{
    private const CACHE_LIST_PREFIX = 'pembayaran:list:v';
    private const CACHE_DETAIL_PREFIX = 'pembayaran:detail:v';
    private const CACHE_VERSION_KEY = 'pembayaran:cache:version';
    private const CACHE_VERSION_LOCK = 'pembayaran:cache:version:lock';
    private const CACHE_TTL = 300; // 5 menit

    public function getList(
        ?string $search = null,
        ?string $dari = null,
        ?string $sampai = null,
        ?int $transaksiId = null,
        int $perPage = 20,
        int $page = 1
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_PREFIX . "{$version}:" . md5(json_encode([
            's'  => $search,
            'd'  => $dari,
            'u'  => $sampai,
            'ti' => $transaksiId,
            'pp' => $perPage,
            'p'  => $page,
        ]));

        $paginator = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($search, $dari, $sampai, $transaksiId, $perPage, $page) {
            $query = Pembayaran::with([
                'transaksiDetail.product.jenis:id,nama',
                'transaksiDetail.product.type:id,nama',
                'transaksiDetail.product.bahan:id,nama',
                'transaksiDetail.transaksi.customer:id,name',
            ])
                ->when($transaksiId, fn($q) => $q->whereHas('transaksiDetail', fn($sub) => $sub->where('transaksi_id', $transaksiId)))
                ->when($dari, fn($q) => $q->whereDate('tanggal_bayar', '>=', $dari))
                ->when($sampai, fn($q) => $q->whereDate('tanggal_bayar', '<=', $sampai))
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sub) use ($search) {
                        $sub->whereHas('transaksiDetail.transaksi', fn($t) => $t->where('kode', 'like', "%{$search}%"))
                            ->orWhereHas('transaksiDetail.transaksi.customer', fn($c) => $c->where('name', 'like', "%{$search}%"))
                            ->orWhereHas('transaksiDetail.product', fn($p) => $p->where('kode', 'like', "%{$search}%"));
                    });
                })
                ->latest('tanggal_bayar');

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

    public function getDetail(int $id): ?Pembayaran
    {
        return Pembayaran::with([
            'transaksiDetail.product.jenis:id,nama',
            'transaksiDetail.product.type:id,nama',
            'transaksiDetail.product.bahan:id,nama',
            'transaksiDetail.transaksi.customer:id,name',
            'transaksiDetail.pembayarans',
        ])->find($id);
    }

    public function create(array $data): Pembayaran
    {
        return DB::transaction(function () use ($data) {
            $detail = TransaksiDetail::with('pembayarans')
                ->lockForUpdate()
                ->findOrFail($data['transaksi_detail_id']);

            $totalBayarSebelumnya = $detail->pembayarans->sum('jumlah_bayar');
            $sisaTagihan = $detail->subtotal - $totalBayarSebelumnya;

            if ($data['jumlah_bayar'] > $sisaTagihan) {
                throw new \Exception(
                    "Jumlah pembayaran melebihi sisa tagihan. Sisa: Rp " .
                    number_format($sisaTagihan, 0, ',', '.')
                );
            }

            $tanggalBayarBaru = Carbon::parse($data['tanggal_bayar'])->startOfDay();

            $pembayaranTerakhir = $detail->pembayarans
                ->whereNotNull('tanggal_bayar')
                ->sortByDesc('tanggal_bayar')
                ->first();

            if ($pembayaranTerakhir) {
                $tanggalTerakhir = Carbon::parse($pembayaranTerakhir->tanggal_bayar)->startOfDay();

                if ($tanggalBayarBaru->lt($tanggalTerakhir)) {
                    throw new \Exception(
                        "Tanggal pembayaran tidak boleh lebih awal dari pembayaran terakhir (" .
                        $tanggalTerakhir->format('d M Y') . ")."
                    );
                }
            }

            $pembayaran = Pembayaran::create([
                'transaksi_detail_id' => $data['transaksi_detail_id'],
                'jumlah_bayar'        => $data['jumlah_bayar'],
                'tanggal_bayar'       => $tanggalBayarBaru->toDateString(),
            ]);

            Log::info('Pembayaran created', [
                'id' => $pembayaran->id,
                'transaksi_detail_id' => $data['transaksi_detail_id'],
                'jumlah_bayar' => $data['jumlah_bayar'],
                'tanggal_bayar' => $tanggalBayarBaru->toDateString(),
                'user_id' => Auth::id(),
            ]);

            return $pembayaran->load([
                'transaksiDetail.product',
                'transaksiDetail.transaksi.customer',
            ]);
        });
    }

    public function update(Pembayaran $pembayaran, array $data): Pembayaran
    {
        return DB::transaction(function () use ($pembayaran, $data) {
            $pembayaran = Pembayaran::lockForUpdate()->findOrFail($pembayaran->id);
            $detail = $pembayaran->transaksiDetail()->with('pembayarans')->first();

            if (isset($data['tanggal_bayar'])) {
                $tanggalBaru = Carbon::parse($data['tanggal_bayar'])->startOfDay();

                $pembayaranLain = $detail->pembayarans
                    ->where('id', '!=', $pembayaran->id)
                    ->whereNotNull('tanggal_bayar')
                    ->sortBy('tanggal_bayar');

                $sebelumnya = $pembayaranLain
                    ->filter(fn($p) => Carbon::parse($p->tanggal_bayar)->lt($tanggalBaru))
                    ->last();

                if ($sebelumnya) {
                    $tglSebelumnya = Carbon::parse($sebelumnya->tanggal_bayar)->startOfDay();
                    if ($tanggalBaru->lt($tglSebelumnya)) {
                        throw new \Exception(
                            "Tanggal tidak boleh lebih awal dari pembayaran sebelumnya (" .
                            $tglSebelumnya->format('d M Y') . ")."
                        );
                    }
                }
            }

            if (isset($data['jumlah_bayar'])) {
                $detail->load('pembayarans');
                $totalBayarLain = $detail->pembayarans
                    ->where('id', '!=', $pembayaran->id)
                    ->sum('jumlah_bayar');

                $maxBolehBayar = $detail->subtotal - $totalBayarLain;

                if ($data['jumlah_bayar'] > $maxBolehBayar) {
                    throw new \Exception(
                        "Jumlah pembayaran melebihi batas. Maksimal: Rp " .
                        number_format($maxBolehBayar, 0, ',', '.')
                    );
                }
            }

            $pembayaran->update($data);

            Log::info('Pembayaran updated', [
                'id' => $pembayaran->id,
                'changes' => $data,
                'user_id' => Auth::id(),
            ]);

            return $pembayaran->fresh()->load([
                'transaksiDetail.product',
                'transaksiDetail.transaksi.customer',
            ]);
        });
    }

    public function delete(Pembayaran $pembayaran): void
    {
        DB::transaction(function () use ($pembayaran) {
            $pembayaran = Pembayaran::lockForUpdate()->findOrFail($pembayaran->id);
            $id = $pembayaran->id;

            $pembayaran->delete();

            Log::info('Pembayaran deleted', [
                'id' => $id,
                'user_id' => Auth::id(),
            ]);
        });
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

                Log::info('Pembayaran cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Pembayaran cache invalidation fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}