<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProductMovement extends Model
{
    protected $fillable = [
        'inventory_id',
        'tipe',
        'qty',
        'ref_type',
        'ref_id',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function inventory(): BelongsTo 
    { 
        return $this->belongsTo(Inventory::class); 
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */
    public function isIn(): bool
    {
        return $this->tipe === 'in';
    }

    public function isOut(): bool
    {
        return $this->tipe === 'out';
    }

    public function isTransfer(): bool
    {
        return $this->tipe === 'transfer';
    }

    public function isProduksi(): bool
    {
        return $this->tipe === 'produksi';
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeByType(Builder $query, ?string $tipe): Builder
    {
        return $query->when($tipe, fn($q) => $q->where('tipe', $tipe));
    }

    public function scopeByInventory(Builder $query, ?int $inventoryId): Builder
    {
        return $query->when($inventoryId, fn($q) => $q->where('inventory_id', $inventoryId));
    }

    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('created_at', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('created_at', '<=', $end));
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

    public function scopeIn(Builder $query): Builder
    {
        return $query->where('tipe', 'in');
    }

    public function scopeOut(Builder $query): Builder
    {
        return $query->where('tipe', 'out');
    }

    public function scopeTransfer(Builder $query): Builder
    {
        return $query->where('tipe', 'transfer');
    }

    public function scopeProduksi(Builder $query): Builder
    {
        return $query->where('tipe', 'produksi');
    }
}