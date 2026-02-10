<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'phone',
        'email',
    ];

    // RELASI BARU → customer punya banyak product
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'customer_id');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'customer_id');
    }

    public function transaksiHarian(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'customer_id')
            ->where('jenis_transaksi', 'daily');
    }

    public function transaksiPesanan(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'customer_id')
            ->where('jenis_transaksi', 'pesanan');
    }

    public function hargaProducts(): HasMany
    {
        return $this->hasMany(HargaProduct::class, 'customer_id');
    }

    public function transaksi_details(): HasManyThrough
    {
        return $this->hasManyThrough(
            TransaksiDetail::class,
            Transaksi::class,
            'customer_id',   // FK di transaksis
            'transaksi_id',  // FK di transaksi_details
            'id',            // PK customers
            'id'             // PK transaksis
        );
    }
}
