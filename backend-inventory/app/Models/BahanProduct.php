<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BahanProduct extends Model
{
    protected $fillable = ['nama'];

    public function products()
    {
        return $this->hasMany(Product::class, 'bahan_id');
    }
}
