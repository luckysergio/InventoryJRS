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
        'distributor_id',
        'harga_beli',
        'qty',
        'foto_depan',
        'foto_samping',
        'foto_atas',
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

    public function distributor()
    {
        return $this->belongsTo(Distributor::class);
    }

    public function getFotoDepanUrlAttribute()
    {
        return $this->foto_depan ? asset('storage/' . $this->foto_depan) : null;
    }

    public function getFotoSampingUrlAttribute()
    {
        return $this->foto_samping ? asset('storage/' . $this->foto_samping) : null;
    }

    public function getFotoAtasUrlAttribute()
    {
        return $this->foto_atas ? asset('storage/' . $this->foto_atas) : null;
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

    public function place()
    {
        return $this->belongsTo(Place::class);
    }

    public function productions()
    {
        return $this->hasMany(Production::class);
    }
}
