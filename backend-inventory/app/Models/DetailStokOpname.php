<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DetailStokOpname extends Model
{
    use HasFactory;

    protected $fillable = [
        'stok_opname_id',
        'inventory_id',
        'stok_sistem',
        'stok_real',
        'selisih',
        'keterangan'
    ];

    public function stokOpname()
    {
        return $this->belongsTo(StokOpname::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}
