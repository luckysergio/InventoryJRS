<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pembayaran extends Model
{
    protected $fillable = ['transaksi_detail_id', 'jumlah_bayar', 'tanggal_bayar'];

    protected function casts(): array
    {
        return [
            'jumlah_bayar' => 'decimal:2',
            'tanggal_bayar' => 'date',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function transaksiDetail(): BelongsTo
    {
        return $this->belongsTo(TransaksiDetail::class, 'transaksi_detail_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tanggal_bayar', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tanggal_bayar', '<=', $end));
    }

    public function scopeByTransaksiDetail(Builder $query, ?int $transaksiDetailId): Builder
    {
        return $query->when($transaksiDetailId, fn($q) => $q->where('transaksi_detail_id', $transaksiDetailId));
    }

    public function scopeWithTransaksiDetail(Builder $query): Builder
    {
        return $query->with(['transaksiDetail' => fn($q) => 
            $q->select(['id', 'transaksi_id', 'product_id', 'subtotal'])
                ->with(['product' => fn($p) => $p->select(['id', 'kode', 'ukuran'])])
        ]);
    }

    public function scopeByMonth(Builder $query, int $month, int $year): Builder
    {
        return $query->whereYear('tanggal_bayar', $year)
                     ->whereMonth('tanggal_bayar', $month);
    }

    public function scopeByYear(Builder $query, int $year): Builder
    {
        return $query->whereYear('tanggal_bayar', $year);
    }
}