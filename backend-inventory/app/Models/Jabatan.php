<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jabatan extends Model
{
    protected $fillable = ['nama'];

    public function karyawans(): HasMany
    {
        return $this->hasMany(Karyawan::class, 'jabatan_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, fn($q) => $q->where('nama', 'like', "%{$search}%"));
    }

    public function scopeWithKaryawanCount(Builder $query): Builder
    {
        return $query->withCount('karyawans');
    }
}