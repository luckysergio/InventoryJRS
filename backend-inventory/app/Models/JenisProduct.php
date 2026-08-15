<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisProduct extends Model
{
    protected $table = 'jenis_products';
    
    protected $fillable = ['nama'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'jenis_id');
    }

    public function types(): HasMany
    {
        return $this->hasMany(TypeProduct::class, 'jenis_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn($q) => $q->where('nama', 'like', "%{$search}%"));
    }

    public function scopeWithCounts(Builder $query): Builder
    {
        return $query->withCount(['products', 'types']);
    }

    public function scopeWithTypes(Builder $query): Builder
    {
        return $query->with(['types' => fn($q) => $q->select(['id', 'nama', 'jenis_id'])]);
    }
}