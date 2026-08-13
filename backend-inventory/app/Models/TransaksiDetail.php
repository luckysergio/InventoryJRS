<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TransaksiDetail extends Model
{
    protected $fillable = [
        'transaksi_id', 'product_id', 'status_transaksi_id', 'qty',
        'harga', 'subtotal', 'discount', 'catatan',
    ];

    protected $appends = ['product_label'];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'harga' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
        ];
    }

    public function transaksi(): BelongsTo { return $this->belongsTo(Transaksi::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function statusTransaksi(): BelongsTo { return $this->belongsTo(StatusTransaksi::class, 'status_transaksi_id'); }
    public function pembayarans(): HasMany { return $this->hasMany(Pembayaran::class, 'transaksi_detail_id'); }
    public function production(): HasOne { return $this->hasOne(Production::class, 'transaksi_detail_id'); }

    protected function totalBayar(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->attributes['pembayarans_sum_jumlah_bayar'] ?? $this->pembayarans->sum('jumlah_bayar'),
        );
    }

    protected function sisaBayar(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->subtotal - $this->total_bayar,
        );
    }

    protected function productLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => collect([
                $this->product?->jenis?->nama,
                $this->product?->type?->nama,
                $this->product?->ukuran,
            ])->filter()->implode(' | ') ?: '-',
        );
    }

    public function isLunas(): bool
    {
        return ($this->subtotal - ($this->discount ?? 0)) <= $this->total_bayar;
    }
}