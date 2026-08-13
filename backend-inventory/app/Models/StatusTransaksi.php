<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StatusTransaksi extends Model
{
    protected $fillable = ['nama'];

    public function transaksiDetails(): HasMany
    {
        return $this->hasMany(TransaksiDetail::class, 'status_transaksi_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn($q) => $q->where('nama', 'like', "%{$search}%"));
    }
}