<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaksi extends Model
{
    protected $fillable = ['customer_id', 'jenis_transaksi', 'tanggal', 'total'];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'total' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo 
    { 
        return $this->belongsTo(Customer::class); 
    }

    public function details(): HasMany 
    { 
        return $this->hasMany(TransaksiDetail::class); 
    }

    public function scopePesanan(Builder $query): Builder 
    { 
        return $query->where('jenis_transaksi', 'pesanan'); 
    }

    public function scopeDaily(Builder $query): Builder 
    { 
        return $query->where('jenis_transaksi', 'daily'); 
    }
    
    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tanggal', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tanggal', '<=', $end));
    }

    public function scopeByCustomer(Builder $query, ?int $customerId): Builder
    {
        return $query->when($customerId, fn($q) => $q->where('customer_id', $customerId));
    }

    public function scopeWithCustomer(Builder $query): Builder
    {
        return $query->with(['customer' => fn($q) => $q->select(['id', 'name', 'phone'])]);
    }

    public function scopeWithDetails(Builder $query): Builder
    {
        return $query->with(['details' => fn($q) => 
            $q->select(['id', 'transaksi_id', 'product_id', 'qty', 'harga', 'subtotal', 'discount'])
                ->with(['product' => fn($p) => $p->select(['id', 'kode', 'ukuran'])])
        ]);
    }

    public function scopeWithDetailsCount(Builder $query): Builder
    {
        return $query->withCount('details');
    }

    public function scopeWithTotalSum(Builder $query): Builder
    {
        return $query->withSum('details', 'subtotal');
    }
}