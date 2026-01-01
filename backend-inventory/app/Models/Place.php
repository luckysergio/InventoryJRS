<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Place extends Model
{
    protected $fillable = [
        'nama',
        'kode',
        'keterangan'
    ];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'inventories')
            ->withPivot('qty')
            ->withTimestamps();
    }
}
