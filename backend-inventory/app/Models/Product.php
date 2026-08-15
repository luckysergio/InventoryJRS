<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

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
            'jenis_id' => 'integer',
            'type_id' => 'integer',
            'bahan_id' => 'integer',
            'distributor_id' => 'integer',
            'customer_id' => 'integer',
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

    public function getTotalStokAttribute(): int
    {
        return $this->inventories()->sum('qty');
    }

    public function getActivePrice(?int $customerId = null, ?string $date = null): ?HargaProduct
    {
        return $this->hargaProducts()
            ->when($customerId, fn($q) => $q->where('customer_id', $customerId))
            ->where('tanggal_berlaku', '<=', $date ?? now())
            ->orderByDesc('tanggal_berlaku')
            ->first();
    }

    public function getActivePriceValue(?int $customerId = null, ?string $date = null): int
    {
        $price = $this->getActivePrice($customerId, $date);
        return $price ? $price->harga : 0;
    }

    public function getStokByPlace(int $placeId): int
    {
        return $this->inventories()
            ->where('place_id', $placeId)
            ->value('qty') ?? 0;
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $driver = config('database.connections.' . config('database.default') . '.driver');
            
            if ($driver === 'mysql') {
                $q->whereRaw(
                    "MATCH(kode, ukuran, keterangan) AGAINST(? IN BOOLEAN MODE)",
                    [$search . '*']
                );
            } else {
                $likeValue = "%{$search}%";
                $q->where(function ($sub) use ($likeValue) {
                    $sub->where('kode', 'like', $likeValue)
                        ->orWhere('ukuran', 'like', $likeValue)
                        ->orWhere('keterangan', 'like', $likeValue);
                });
            }
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
        return $query->with([
            'jenis' => fn($q) => $q->select(['id', 'nama']),
            'type' => fn($q) => $q->select(['id', 'nama', 'jenis_id']),
            'bahan' => fn($q) => $q->select(['id', 'nama']),
            'distributor' => fn($q) => $q->select(['id', 'nama']),
            'customer' => fn($q) => $q->select(['id', 'name']),
        ]);
    }

    public function scopeWithInventories(Builder $query): Builder
    {
        return $query->with(['inventories' => fn($q) => 
            $q->select(['id', 'product_id', 'place_id', 'qty'])
                ->with(['place' => fn($p) => $p->select(['id', 'nama', 'kode'])])
        ]);
    }

    public function scopeWithTotalStok(Builder $query): Builder
    {
        return $query->withSum('inventories', 'qty');
    }

    public function scopeWithActivePrice(Builder $query, ?int $customerId = null): Builder
    {
        return $query->with(['hargaProducts' => fn($q) => 
            $q->when($customerId, fn($q2) => $q2->where('customer_id', $customerId))
                ->where('tanggal_berlaku', '<=', now())
                ->orderByDesc('tanggal_berlaku')
                ->limit(1)
        ]);
    }
}