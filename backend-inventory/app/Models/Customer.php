<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'phone',
        'email'
    ];

    protected $dates = [
        'created_at',
        'updated_at',
    ];

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'customer_id');
    }

    public function transaksiHarian()
    {
        return $this->hasMany(Transaksi::class, 'customer_id')
            ->where('jenis_transaksi', 'daily');
    }

    public function transaksiPesanan()
    {
        return $this->hasMany(Transaksi::class, 'customer_id')
            ->where('jenis_transaksi', 'pesanan');
    }
}
