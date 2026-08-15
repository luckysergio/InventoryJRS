<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Production extends Model
{
    protected $fillable = [
        'product_id',
        'karyawan_id',
        'transaksi_detail_id',
        'jenis_pembuatan',
        'qty',
        'status',
        'tanggal_mulai',
        'tanggal_selesai',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'tanggal_mulai' => 'datetime',
            'tanggal_selesai' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function product(): BelongsTo 
    { 
        return $this->belongsTo(Product::class); 
    }

    public function karyawan(): BelongsTo 
    { 
        return $this->belongsTo(Karyawan::class); 
    }

    public function transaksiDetail(): BelongsTo 
    { 
        return $this->belongsTo(TransaksiDetail::class); 
    }

    public function movements(): MorphMany
    {
        return $this->morphMany(ProductMovement::class, 'ref');
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */
    public function getDurationMinutes(): ?int
    {
        if (!$this->tanggal_mulai || !$this->tanggal_selesai) {
            return null;
        }

        return $this->tanggal_mulai->diffInMinutes($this->tanggal_selesai);
    }

    public function isAntri(): bool
    {
        return $this->status === 'antri';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'produksi';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'selesai';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'batal';
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeAntri(Builder $query): Builder 
    { 
        return $query->where('status', 'antri'); 
    }

    public function scopeInProgress(Builder $query): Builder 
    { 
        return $query->where('status', 'produksi'); 
    }

    public function scopeCompleted(Builder $query): Builder 
    { 
        return $query->where('status', 'selesai'); 
    }

    public function scopeCancelled(Builder $query): Builder 
    { 
        return $query->where('status', 'batal'); 
    }

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        return $query->when($status, fn($q) => $q->where('status', $status));
    }

    public function scopeByProduct(Builder $query, ?int $productId): Builder
    {
        return $query->when($productId, fn($q) => $q->where('product_id', $productId));
    }

    public function scopeByKaryawan(Builder $query, ?int $karyawanId): Builder
    {
        return $query->when($karyawanId, fn($q) => $q->where('karyawan_id', $karyawanId));
    }

    public function scopeByJenisPembuatan(Builder $query, ?string $jenis): Builder
    {
        return $query->when($jenis, fn($q) => $q->where('jenis_pembuatan', $jenis));
    }

    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tanggal_mulai', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tanggal_mulai', '<=', $end));
    }

    public function scopeWithProduct(Builder $query): Builder
    {
        return $query->with(['product' => fn($q) => $q->select(['id', 'kode', 'ukuran'])]);
    }

    public function scopeWithKaryawan(Builder $query): Builder
    {
        return $query->with(['karyawan' => fn($q) => $q->select(['id', 'nama', 'no_hp'])]);
    }

    public function scopeWithTransaksiDetail(Builder $query): Builder
    {
        return $query->with(['transaksiDetail' => fn($q) => 
            $q->select(['id', 'transaksi_id', 'product_id', 'qty', 'harga', 'subtotal'])
        ]);
    }
}