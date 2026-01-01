<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'kode',
        'jenis_id',
        'type_id',
        'bahan_id',
        'status_id',
        'qty',
        'ukuran',
        'keterangan'
    ];

    public function jenis()
    {
        return $this->belongsTo(JenisProduct::class, 'jenis_id');
    }

    public function type()
    {
        return $this->belongsTo(TypeProduct::class, 'type_id');
    }

    public function bahan()
    {
        return $this->belongsTo(BahanProduct::class, 'bahan_id');
    }

    public function status()
    {
        return $this->belongsTo(StatusProduct::class, 'status_id');
    }

    public function hargaProducts()
    {
        return $this->hasMany(HargaProduct::class, 'product_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function details()
    {
        return $this->hasMany(TransaksiDetail::class);
    }

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function productions()
    {
        return $this->hasMany(Production::class);
    }
}
