<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HargaProduct extends Model
{
    protected $table = 'harga_products';

    protected $fillable = [
        'product_id',
        'customer_id',
        'harga',
        'tanggal_berlaku',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_berlaku' => 'date',
        'harga'           => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}