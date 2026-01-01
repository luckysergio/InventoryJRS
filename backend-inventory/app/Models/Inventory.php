<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'product_id',
        'place_id',
        'qty'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function place()
    {
        return $this->belongsTo(Place::class);
    }

    public function movements()
    {
        return $this->hasMany(ProductMovement::class);
    }
}
