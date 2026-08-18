<?php

namespace App\Services\StatusTransaksi;

use App\Models\StatusTransaksi;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StatusTransaksiService
{
    private const CACHE_LIST_KEY = 'status_transaksi:list:v';
    private const CACHE_VERSION_KEY = 'status_transaksi:cache:version';
    private const CACHE_VERSION_LOCK = 'status_transaksi:cache:version:lock';
    private const CACHE_TTL = 7200; // 2 jam (data master jarang berubah)

    /**
     * Get all status transaksi (cached).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getAll(): array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_LIST_KEY . $version;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return StatusTransaksi::orderBy('id', 'asc')
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'nama' => $s->nama,
                    'created_at' => $s->created_at?->toISOString(),
                    'updated_at' => $s->updated_at?->toISOString(),
                ])
                ->toArray();
        });
    }

    public function create(array $data): StatusTransaksi
    {
        return DB::transaction(function () use ($data) {
            $status = StatusTransaksi::create([
                'nama' => $data['nama'],
            ]);

            Log::info('StatusTransaksi created', [
                'id' => $status->id,
                'nama' => $status->nama,
            ]);

            return $status;
        });
    }

    public function update(StatusTransaksi $status, array $data): StatusTransaksi
    {
        return DB::transaction(function () use ($status, $data) {
            if (!$status->exists) {
                throw new \Exception("Gagal update: Data status transaksi tidak valid.");
            }

            $status->update([
                'nama' => $data['nama'],
            ]);

            Log::info('StatusTransaksi updated', [
                'id' => $status->id,
                'nama' => $status->nama,
            ]);

            return $status->fresh();
        });
    }

    /**
     * Delete status transaksi with relation protection.
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(StatusTransaksi $status): array
    {
        $id = $status->id;
        $nama = $status->nama;

        if (!$id || !$status->exists) {
            return [
                'success' => false,
                'code' => 400,
                'message' => 'Data status transaksi tidak valid.',
            ];
        }

        $hasTransaksiDetails = DB::table('transaksi_details')
            ->where('status_transaksi_id', $id)
            ->exists();

        if ($hasTransaksiDetails) {
            return [
                'success' => false,
                'code' => 422,
                'message' => "Status '{$nama}' tidak dapat dihapus karena masih digunakan oleh riwayat transaksi.",
            ];
        }

        DB::transaction(function () use ($status) {
            $status->delete();
        });

        Log::info('StatusTransaksi deleted', ['id' => $id, 'nama' => $nama]);

        return [
            'success' => true,
            'message' => "Status '{$nama}' berhasil dihapus.",
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

                Log::info('StatusTransaksi cache invalidated', [
                    'old_version' => $current,
                    'new_version' => $current + 1,
                ]);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('StatusTransaksi cache invalidation fallback used', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}