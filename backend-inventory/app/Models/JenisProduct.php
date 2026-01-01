<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisProduct extends Model
{
    protected $fillable = ['nama'];

    public function products()
    {
        return $this->hasMany(Product::class, 'jenis_id');
    }

    public function types()
    {
        return $this->hasMany(TypeProduct::class, 'jenis_id');
    }
}
