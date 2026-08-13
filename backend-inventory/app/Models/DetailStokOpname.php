<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailStokOpname extends Model
{
    use HasFactory;

    protected $fillable = [
        'stok_opname_id', 'inventory_id', 'stok_sistem', 'stok_real', 'selisih', 'keterangan'
    ];

    protected function casts(): array
    {
        return [
            'stok_sistem' => 'integer',
            'stok_real' => 'integer',
            'selisih' => 'integer',
        ];
    }

    public function stokOpname(): BelongsTo { return $this->belongsTo(StokOpname::class); }
    public function inventory(): BelongsTo { return $this->belongsTo(Inventory::class); }
}