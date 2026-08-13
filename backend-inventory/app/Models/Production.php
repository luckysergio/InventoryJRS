<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Production extends Model
{
    protected $fillable = [
        'product_id', 'karyawan_id', 'transaksi_detail_id',
        'jenis_pembuatan', 'qty', 'status', 'tanggal_mulai', 'tanggal_selesai'
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'tanggal_mulai' => 'datetime',
            'tanggal_selesai' => 'datetime',
        ];
    }

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function karyawan(): BelongsTo { return $this->belongsTo(Karyawan::class); }
    public function transaksiDetail(): BelongsTo { return $this->belongsTo(TransaksiDetail::class); }

    public function movements(): MorphMany
    {
        return $this->morphMany(ProductMovement::class, 'ref');
    }

    public function scopeAntri(Builder $query): Builder { return $query->where('status', 'antri'); }
}