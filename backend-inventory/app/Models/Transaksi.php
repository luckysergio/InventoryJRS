<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaksi extends Model
{
    protected $fillable = ['customer_id', 'jenis_transaksi', 'tanggal', 'total'];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'total' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function details(): HasMany { return $this->hasMany(TransaksiDetail::class); }

    public function scopePesanan(Builder $query): Builder { return $query->where('jenis_transaksi', 'pesanan'); }
    public function scopeDaily(Builder $query): Builder { return $query->where('jenis_transaksi', 'daily'); }
    
    public function scopeDateRange(Builder $query, mixed $start = null, mixed $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tanggal', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tanggal', '<=', $end));
    }
}