<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Place extends Model
{
    protected $fillable = ['nama', 'kode', 'keterangan'];

    public function inventories(): HasMany { return $this->hasMany(Inventory::class); }
    
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'inventories')
            ->withPivot('qty')
            ->withTimestamps();
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn($q) => $q->where('nama', 'like', "%{$search}%")->orWhere('kode', 'like', "%{$search}%"));
    }
}