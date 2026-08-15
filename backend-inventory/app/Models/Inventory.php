<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventory extends Model
{
    protected $fillable = ['product_id', 'place_id', 'qty'];

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
    public function product(): BelongsTo 
    { 
        return $this->belongsTo(Product::class); 
    }

    public function place(): BelongsTo 
    { 
        return $this->belongsTo(Place::class); 
    }

    public function movements(): HasMany 
    { 
        return $this->hasMany(ProductMovement::class); 
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeByProduct(Builder $query, ?int $productId): Builder
    {
        return $query->when($productId, fn($q) => $q->where('product_id', $productId));
    }

    public function scopeByPlace(Builder $query, ?int $placeId): Builder
    {
        return $query->when($placeId, fn($q) => $q->where('place_id', $placeId));
    }

    public function scopeWithProduct(Builder $query): Builder
    {
        return $query->with(['product' => fn($q) => $q->select(['id', 'kode', 'ukuran'])]);
    }

    public function scopeWithPlace(Builder $query): Builder
    {
        return $query->with(['place' => fn($q) => $q->select(['id', 'nama', 'kode'])]);
    }

    public function scopeWithMovements(Builder $query, int $limit = 10): Builder
    {
        return $query->with(['movements' => fn($q) => 
            $q->select(['id', 'inventory_id', 'tipe', 'qty', 'ref_type', 'ref_id', 'created_at'])
                ->latest()
                ->limit($limit)
        ]);
    }
}