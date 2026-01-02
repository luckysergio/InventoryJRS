<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'phone',
        'email',
    ];


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
}
