<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HargaProduct extends Model
{
    protected $table = 'harga_products';

    protected $fillable = [
        'product_id',
        'customer_id',
        'harga',
        'tanggal_berlaku',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_berlaku' => 'date',
            'harga' => 'integer',
        ];
    }

    public function product(): BelongsTo 
    { 
        return $this->belongsTo(Product::class); 
    }

    public function customer(): BelongsTo 
    { 
        return $this->belongsTo(Customer::class); 
    }

    public function scopeActive(Builder $query, ?string $date = null): Builder
    {
        return $query->where('tanggal_berlaku', '<=', $date ?? now())
                     ->orderByDesc('tanggal_berlaku');
    }

    public function scopeByProduct(Builder $query, int $productId): Builder
    {
        return $query->where('product_id', $productId);
    }

    public function scopeByCustomer(Builder $query, ?int $customerId): Builder
    {
        return $query->when($customerId, fn($q) => $q->where('customer_id', $customerId));
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $q->whereHas('product', function ($q2) use ($search) {
                $q2->where('kode', 'like', "%{$search}%");
            });
        });
    }

    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tanggal_berlaku', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tanggal_berlaku', '<=', $end));
    }

    public function scopeWithProduct(Builder $query): Builder
    {
        return $query->with(['product' => fn($q) => $q->select(['id', 'kode', 'ukuran'])]);
    }

    public function scopeWithCustomer(Builder $query): Builder
    {
        return $query->with(['customer' => fn($q) => $q->select(['id', 'name'])]);
    }
}