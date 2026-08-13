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

    public function transaksiDetail(): BelongsTo
    {
        return $this->belongsTo(TransaksiDetail::class, 'transaksi_detail_id');
    }

    public function scopeDateRange(Builder $query, mixed $start = null, mixed $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tanggal_bayar', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tanggal_bayar', '<=', $end));
    }
}