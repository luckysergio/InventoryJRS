<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransaksiDetail extends Model
{
    protected $fillable = [
        'transaksi_id',
        'product_id',
        'status_transaksi_id',
        'tanggal',
        'qty',
        'harga',
        'subtotal',
        'discount',
    ];

    protected $appends = ['product_label'];


    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function statusTransaksi()
    {
        return $this->belongsTo(StatusTransaksi::class, 'status_transaksi_id');
    }

    public function pembayarans()
    {
        return $this->hasMany(Pembayaran::class, 'transaksi_detail_id');
    }


    public function getTotalBayarAttribute()
    {
        return $this->pembayarans->sum('jumlah_bayar');
    }

    public function getSisaBayarAttribute()
    {
        return $this->subtotal - $this->total_bayar;
    }

    /**
     * 👉 LABEL PRODUK
     * Format: Jenis | Type | Ukuran
     */
    public function getProductLabelAttribute()
    {
        if (!$this->relationLoaded('product') || !$this->product) {
            return '-';
        }

        return collect([
            $this->product->jenis->nama ?? null,
            $this->product->type->nama ?? null,
            $this->product->ukuran ?? null,
        ])->filter()->implode(' | ');
    }

    public function isLunas()
    {
        return ($this->subtotal - ($this->discount ?? 0)) <= $this->totalBayar;
    }

    public function production()
    {
        return $this->hasOne(Production::class);
    }
}
