<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailStokOpname extends Model
{
    protected $fillable = [
        'stok_opname_id',
        'inventory_id',
        'stok_sistem',
        'stok_real',
        'selisih',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'stok_sistem' => 'integer',
            'stok_real' => 'integer',
            'selisih' => 'integer',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function stokOpname(): BelongsTo 
    { 
        return $this->belongsTo(StokOpname::class); 
    }

    public function inventory(): BelongsTo 
    { 
        return $this->belongsTo(Inventory::class); 
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */
    public function calculateSelisih(): int
    {
        return ($this->stok_real ?? 0) - $this->stok_sistem;
    }

    public function hasSelisih(): bool
    {
        return $this->selisih !== 0;
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeByStokOpname(Builder $query, ?int $stokOpnameId): Builder
    {
        return $query->when($stokOpnameId, fn($q) => $q->where('stok_opname_id', $stokOpnameId));
    }

    public function scopeByInventory(Builder $query, ?int $inventoryId): Builder
    {
        return $query->when($inventoryId, fn($q) => $q->where('inventory_id', $inventoryId));
    }

    public function scopeWithInventory(Builder $query): Builder
    {
        return $query->with(['inventory' => fn($q) => 
            $q->select(['id', 'product_id', 'place_id', 'qty'])
                ->with([
                    'product' => fn($p) => $p->select(['id', 'kode', 'ukuran']),
                    'place' => fn($pl) => $pl->select(['id', 'nama', 'kode']),
                ])
        ]);
    }

    public function scopeWithSelisih(Builder $query): Builder
    {
        return $query->where('selisih', '!=', 0);
    }

    public function scopePositiveSelisih(Builder $query): Builder
    {
        return $query->where('selisih', '>', 0);
    }

    public function scopeNegativeSelisih(Builder $query): Builder
    {
        return $query->where('selisih', '<', 0);
    }
}