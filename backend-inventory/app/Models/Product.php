<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'kode',
        'jenis_id',
        'type_id',
        'bahan_id',
        'distributor_id',
        'customer_id',
        'harga_beli',
        'ukuran',
        'foto_depan',
        'foto_samping',
        'foto_atas',
        'keterangan',
    ];

    protected $appends = [
        'foto_depan_url',
        'foto_samping_url',
        'foto_atas_url',
    ];

    protected function casts(): array
    {
        return [
            'harga_beli' => 'integer',
        ];
    }

    public function jenis(): BelongsTo
    {
        return $this->belongsTo(JenisProduct::class, 'jenis_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(TypeProduct::class, 'type_id');
    }

    public function bahan(): BelongsTo
    {
        return $this->belongsTo(BahanProduct::class, 'bahan_id');
    }

    public function distributor(): BelongsTo
    {
        return $this->belongsTo(Distributor::class, 'distributor_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function hargaProducts(): HasMany
    {
        return $this->hasMany(HargaProduct::class, 'product_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(TransaksiDetail::class, 'product_id');
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class, 'product_id');
    }

    public function productions(): HasMany
    {
        return $this->hasMany(Production::class, 'product_id');
    }

    public function getFotoDepanUrlAttribute(): ?string
    {
        return $this->foto_depan ? Storage::url($this->foto_depan) : null;
    }

    public function getFotoSampingUrlAttribute(): ?string
    {
        return $this->foto_samping ? Storage::url($this->foto_samping) : null;
    }

    public function getFotoAtasUrlAttribute(): ?string
    {
        return $this->foto_atas ? Storage::url($this->foto_atas) : null;
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->where('kode', 'like', "%{$search}%")
              ->orWhere('ukuran', 'like', "%{$search}%")
              ->orWhere('keterangan', 'like', "%{$search}%");
        });
    }

    public function scopeByJenis(Builder $query, ?int $jenisId): Builder
    {
        return $query->when($jenisId, fn($q) => $q->where('jenis_id', $jenisId));
    }

    public function scopeByType(Builder $query, ?int $typeId): Builder
    {
        return $query->when($typeId, fn($q) => $q->where('type_id', $typeId));
    }

    public function scopeByBahan(Builder $query, ?int $bahanId): Builder
    {
        return $query->when($bahanId, fn($q) => $q->where('bahan_id', $bahanId));
    }

    public function scopeByDistributor(Builder $query, ?int $distributorId): Builder
    {
        return $query->when($distributorId, fn($q) => $q->where('distributor_id', $distributorId));
    }

    public function scopeByCustomer(Builder $query, ?int $customerId): Builder
    {
        return $query->when($customerId, fn($q) => $q->where('customer_id', $customerId));
    }

    public function scopeWithRelations(Builder $query): Builder
    {
        return $query->with(['jenis', 'type', 'bahan', 'distributor', 'customer']);
    }

    public function getActivePrice(?int $customerId = null, ?string $date = null): ?HargaProduct
    {
        return $this->hargaProducts()
            ->when($customerId, fn($q) => $q->where('customer_id', $customerId))
            ->where('tanggal_berlaku', '<=', $date ?? now())
            ->orderByDesc('tanggal_berlaku')
            ->first();
    }

    public function getTotalStokAttribute(): int
    {
        return $this->inventories()->sum('qty');
    }
}