<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Production extends Model
{
    protected $fillable = [
        'product_id',
        'karyawan_id',
        'transaksi_detail_id',
        'jenis_pembuatan',
        'qty',
        'status',
        'tanggal_mulai',
        'tanggal_selesai'
    ];

    protected $casts = [
        'tanggal_mulai' => 'datetime',
        'tanggal_selesai' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function transaksiDetail()
    {
        return $this->belongsTo(TransaksiDetail::class);
    }

    public function movements()
    {
        return $this->hasMany(ProductMovement::class, 'ref_id')
            ->where('ref_type', 'production');
    }
}
