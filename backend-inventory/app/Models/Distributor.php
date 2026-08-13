<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distributor extends Model
{
    protected $fillable = [
        'nama',
        'no_hp',
        'email',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'distributor_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where('nama', 'like', "%{$search}%")
              ->orWhere('no_hp', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    public function scopeWithProductCount(Builder $query): Builder
    {
        return $query->withCount('products');
    }
}