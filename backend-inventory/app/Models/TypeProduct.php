<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeProduct extends Model
{
    protected $table = 'type_products';
    
    protected $fillable = [
        'nama',
        'jenis_id',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'type_id');
    }

    public function jenis(): BelongsTo
    {
        return $this->belongsTo(JenisProduct::class, 'jenis_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn($q) => $q->where('nama', 'like', "%{$search}%"));
    }

    public function scopeByJenis(Builder $query, ?int $jenisId): Builder
    {
        return $query->when($jenisId, fn($q) => $q->where('jenis_id', $jenisId));
    }

    public function scopeWithProductCount(Builder $query): Builder
    {
        return $query->withCount('products');
    }

    public function scopeWithJenis(Builder $query): Builder
    {
        return $query->with(['jenis' => fn($q) => $q->select(['id', 'nama'])]);
    }
}