<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'phone',
        'email',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'customer_id');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'customer_id');
    }

    public function transaksiHarian(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'customer_id')
            ->where('jenis_transaksi', 'daily');
    }

    public function transaksiPesanan(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'customer_id')
            ->where('jenis_transaksi', 'pesanan');
    }

    public function hargaProducts(): HasMany
    {
        return $this->hasMany(HargaProduct::class, 'customer_id');
    }

    public function transaksi_details(): HasManyThrough
    {
        return $this->hasManyThrough(
            TransaksiDetail::class,
            Transaksi::class,
            'customer_id',
            'transaksi_id',
            'id',
            'id'
        );
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    public function scopeWithStats(Builder $query): Builder
    {
        return $query->withCount(['transaksi', 'transaksiHarian', 'transaksiPesanan'])
            ->withSum('transaksi', 'total');
    }

    public function getTotalBelanjaAttribute(): float
    {
        return (float) $this->transaksi()->sum('total');
    }
}