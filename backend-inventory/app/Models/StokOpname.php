<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StokOpname extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'tgl_opname', 'keterangan', 'status'];

    protected function casts(): array
    {
        return [
            'tgl_opname' => 'date',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function user(): BelongsTo 
    { 
        return $this->belongsTo(User::class); 
    }

    public function details(): HasMany 
    { 
        return $this->hasMany(DetailStokOpname::class); 
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'selesai';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'dibatalkan';
    }

    public function getTotalSelisih(): int
    {
        return $this->details()->sum('selisih');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeDraft(Builder $query): Builder 
    { 
        return $query->where('status', 'draft'); 
    }

    public function scopeSelesai(Builder $query): Builder 
    { 
        return $query->where('status', 'selesai'); 
    }

    public function scopeDibatalkan(Builder $query): Builder 
    { 
        return $query->where('status', 'dibatalkan'); 
    }

    public function scopeByStatus(Builder $query, ?string $status): Builder
    {
        return $query->when($status, fn($q) => $q->where('status', $status));
    }

    public function scopeByUser(Builder $query, ?int $userId): Builder
    {
        return $query->when($userId, fn($q) => $q->where('user_id', $userId));
    }

    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query->when($start, fn($q) => $q->whereDate('tgl_opname', '>=', $start))
                     ->when($end, fn($q) => $q->whereDate('tgl_opname', '<=', $end));
    }

    public function scopeWithUser(Builder $query): Builder
    {
        return $query->with(['user' => fn($q) => $q->select(['id', 'name', 'email'])]);
    }

    public function scopeWithDetails(Builder $query): Builder
    {
        return $query->with(['details' => fn($q) => 
            $q->select(['id', 'stok_opname_id', 'inventory_id', 'stok_sistem', 'stok_real', 'selisih'])
                ->with(['inventory' => fn($i) => 
                    $i->select(['id', 'product_id', 'place_id'])
                        ->with(['product' => fn($p) => $p->select(['id', 'kode', 'ukuran'])])
                ])
        ]);
    }

    public function scopeWithDetailsCount(Builder $query): Builder
    {
        return $query->withCount('details');
    }

    public function scopeWithTotalSelisih(Builder $query): Builder
    {
        return $query->withSum('details', 'selisih');
    }
}