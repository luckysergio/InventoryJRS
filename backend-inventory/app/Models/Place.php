<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Place extends Model
{
    protected $fillable = ['nama', 'kode', 'keterangan'];

    public function inventories(): HasMany 
    { 
        return $this->hasMany(Inventory::class); 
    }
    
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'inventories')
            ->withPivot('qty')
            ->withTimestamps();
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $likeValue = "%{$search}%";
            $q->where(function ($sub) use ($likeValue) {
                $sub->where('nama', 'like', $likeValue)
                    ->orWhere('kode', 'like', $likeValue);
            });
        });
    }

    public function scopeWithInventories(Builder $query): Builder
    {
        return $query->with(['inventories' => fn($q) => 
            $q->select(['id', 'product_id', 'place_id', 'qty'])
                ->with(['product' => fn($p) => $p->select(['id', 'kode', 'ukuran'])])
        ]);
    }

    public function scopeWithProductCount(Builder $query): Builder
    {
        return $query->withCount('inventories');
    }

    public function scopeWithTotalStok(Builder $query): Builder
    {
        return $query->withSum('inventories', 'qty');
    }
}