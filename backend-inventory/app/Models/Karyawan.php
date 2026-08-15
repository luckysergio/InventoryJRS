<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Karyawan extends Model
{
    protected $fillable = [
        'nama',
        'no_hp',
        'email',
        'jabatan_id',
    ];

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
            $likeValue = "%{$search}%";
            $q->where(function ($sub) use ($likeValue) {
                $sub->where('nama', 'like', $likeValue)
                    ->orWhere('no_hp', 'like', $likeValue)
                    ->orWhere('email', 'like', $likeValue);
            });
        });
    }

    public function scopeByJabatan(Builder $query, ?int $jabatanId): Builder
    {
        return $query->when($jabatanId, fn($q) => $q->where('jabatan_id', $jabatanId));
    }

    public function scopeWithJabatan(Builder $query): Builder
    {
        return $query->with(['jabatan' => fn($q) => $q->select(['id', 'nama'])]);
    }

    public function scopeWithProductionCount(Builder $query): Builder
    {
        return $query->withCount('productions');
    }

    public function scopeWithActiveProductions(Builder $query): Builder
    {
        return $query->withCount(['productions as active_productions_count' => fn($q) => 
            $q->whereIn('status', ['antri', 'produksi'])
        ]);
    }
}