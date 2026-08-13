<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Karyawan extends Model
{
    protected $fillable = ['nama', 'no_hp', 'email', 'jabatan_id'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    public function jabatan(): BelongsTo
    {
        return $this->belongsTo(Jabatan::class, 'jabatan_id');
    }

    public function productions(): HasMany
    {
        return $this->hasMany(Production::class, 'karyawan_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where('nama', 'like', "%{$search}%")
              ->orWhere('no_hp', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    public function scopeByJabatan(Builder $query, ?int $jabatanId): Builder
    {
        return $query->when($jabatanId, fn($q) => $q->where('jabatan_id', $jabatanId));
    }
}