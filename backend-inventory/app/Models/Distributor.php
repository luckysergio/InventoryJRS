<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Distributor extends Model
{
    protected $fillable = [
        'nama',
        'no_hp',
        'email',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
