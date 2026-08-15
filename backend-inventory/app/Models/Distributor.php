<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distributor extends Model
{
    protected $table = 'distributors';

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
            $likeValue = "%{$search}%";
            $q->where(function ($sub) use ($likeValue) {
                $sub->where('nama', 'like', $likeValue)
                    ->orWhere('no_hp', 'like', $likeValue)
                    ->orWhere('email', 'like', $likeValue);
            });
        });
    }

    public function scopeWithProductCount(Builder $query): Builder
    {
        return $query->withCount('products');
    }

    public function scopeWithProducts(Builder $query): Builder
    {
        return $query->with(['products' => fn($q) => $q->select(['id', 'kode', 'ukuran', 'distributor_id'])]);
    }
}