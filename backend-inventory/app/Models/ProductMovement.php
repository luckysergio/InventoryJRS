<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductMovement extends Model
{
    protected $fillable = [
        'inventory_id',
        'tipe',
        'qty',
        'ref_type',
        'ref_id',
        'keterangan'
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}
