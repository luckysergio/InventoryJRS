<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\Cache;

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

    public function transaksiDetails(): HasManyThrough
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

    public function getTotalBelanjaAttribute(): float
    {
        $cacheKey = "customer:{$this->id}:total_belanja";
        
        return Cache::remember($cacheKey, 300, function () {
            return (float) $this->transaksi()->sum('total');
        });
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $driver = config('database.connections.' . config('database.default') . '.driver');
            
            if ($driver === 'mysql') {
                $q->whereRaw(
                    "MATCH(name, email) AGAINST(? IN BOOLEAN MODE)",
                    [$search . '*']
                );
            } else {
                $likeValue = "%{$search}%";
                $q->where(function ($sub) use ($likeValue) {
                    $sub->where('name', 'like', $likeValue)
                        ->orWhere('phone', 'like', $likeValue)
                        ->orWhere('email', 'like', $likeValue);
                });
            }
        });
    }

    public function scopeWithStats(Builder $query): Builder
    {
        return $query->withCount(['transaksi', 'transaksiHarian', 'transaksiPesanan'])
            ->withSum('transaksi', 'total');
    }

    public function scopeWithProducts(Builder $query): Builder
    {
        return $query->with(['products' => fn($q) => $q->select(['id', 'kode', 'ukuran', 'customer_id'])]);
    }

    public function scopeWithRecentTransaksi(Builder $query, int $limit = 5): Builder
    {
        return $query->with(['transaksi' => fn($q) => 
            $q->select(['id', 'customer_id', 'tanggal', 'total', 'jenis_transaksi'])
                ->latest('tanggal')
                ->limit($limit)
        ]);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereHas('transaksi');
    }
}