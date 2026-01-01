<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeProduct extends Model
{
    protected $fillable = ['nama', 'jenis_id'];

    public function products()
    {
        return $this->hasMany(Product::class, 'type_id');
    }

    public function jenis()
    {
        return $this->belongsTo(JenisProduct::class, 'jenis_id');
    }
}
