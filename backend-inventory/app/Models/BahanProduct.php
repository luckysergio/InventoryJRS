<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BahanProduct extends Model
{
    protected $fillable = ['nama'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'bahan_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn($q) => $q->where('nama', 'like', "%{$search}%"));
    }

    public function scopeWithProductCount(Builder $query): Builder
    {
        return $query->withCount('products');
    }
}