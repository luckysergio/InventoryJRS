<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaProduct extends Model
{
    protected $table = 'harga_products';

    protected $fillable = [
        'product_id',
        'harga',
        'tanggal_berlaku',
        'keterangan'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
