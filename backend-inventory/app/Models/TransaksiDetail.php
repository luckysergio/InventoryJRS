<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TransaksiDetail extends Model
{
    protected $fillable = [
        'transaksi_id',
        'product_id',
        'status_transaksi_id',
        'qty',
        'harga',
        'subtotal',
        'discount',
        'catatan',
    ];

    protected $appends = ['product_label'];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'harga' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
        ];
    }

    public function transaksi(): BelongsTo 
    { 
        return $this->belongsTo(Transaksi::class); 
    }

    public function product(): BelongsTo 
    { 
        return $this->belongsTo(Product::class); 
    }

    public function statusTransaksi(): BelongsTo 
    { 
        return $this->belongsTo(StatusTransaksi::class, 'status_transaksi_id'); 
    }

    public function pembayarans(): HasMany 
    { 
        return $this->hasMany(Pembayaran::class, 'transaksi_detail_id'); 
    }

    public function production(): HasOne 
    { 
        return $this->hasOne(Production::class, 'transaksi_detail_id'); 
    }

    protected function totalBayar(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->attributes['pembayarans_sum_jumlah_bayar'] ?? $this->pembayarans->sum('jumlah_bayar'),
        );
    }

    protected function sisaBayar(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->subtotal - $this->total_bayar,
        );
    }

    protected function productLabel(): Attribute
    {
        return Attribute::make(
            get: fn() => collect([
                $this->product?->jenis?->nama,
                $this->product?->type?->nama,
                $this->product?->ukuran,
            ])->filter()->implode(' | ') ?: '-',
        );
    }

    public function isLunas(): bool
    {
        return ($this->subtotal - ($this->discount ?? 0)) <= $this->total_bayar;
    }

    public function getDiscountPercentage(): float
    {
        if ($this->subtotal <= 0) {
            return 0;
        }
        
        return round(($this->discount / $this->subtotal) * 100, 2);
    }

    public function scopeByProduct(Builder $query, ?int $productId): Builder
    {
        return $query->when($productId, fn($q) => $q->where('product_id', $productId));
    }

    public function scopeByStatus(Builder $query, ?int $statusId): Builder
    {
        return $query->when($statusId, fn($q) => $q->where('status_transaksi_id', $statusId));
    }

    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereHas('transaksi', fn($t) => $t->whereDate('tanggal', '>=', $start)))
                     ->when($end, fn($q) => $q->whereHas('transaksi', fn($t) => $t->whereDate('tanggal', '<=', $end)));
    }

    public function scopeWithProduct(Builder $query): Builder
    {
        return $query->with(['product' => fn($q) => 
            $q->select(['id', 'kode', 'ukuran', 'jenis_id', 'type_id'])
                ->with([
                    'jenis' => fn($j) => $j->select(['id', 'nama']),
                    'type' => fn($t) => $t->select(['id', 'nama', 'jenis_id']),
                ])
        ]);
    }

    public function scopeWithPembayarans(Builder $query): Builder
    {
        return $query->with(['pembayarans' => fn($q) => 
            $q->select(['id', 'transaksi_detail_id', 'jumlah_bayar', 'tanggal_bayar'])
                ->orderByDesc('tanggal_bayar')
        ]);
    }

    public function scopeWithTotalBayar(Builder $query): Builder
    {
        return $query->withSum('pembayarans', 'jumlah_bayar');
    }

    public function scopeLunas(Builder $query): Builder
    {
        return $query->whereHas('pembayarans', function ($q) {
            $q->selectRaw('transaksi_detail_id, SUM(jumlah_bayar) as total')
                ->groupBy('transaksi_detail_id')
                ->havingRaw('total >= transaksi_details.subtotal');
        });
    }

    public function scopeBelumLunas(Builder $query): Builder
    {
        return $query->whereDoesntHave('pembayarans', function ($q) {
            $q->selectRaw('transaksi_detail_id, SUM(jumlah_bayar) as total')
                ->groupBy('transaksi_detail_id')
                ->havingRaw('total >= transaksi_details.subtotal');
        });
    }
}