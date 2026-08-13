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

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function details(): HasMany { return $this->hasMany(DetailStokOpname::class); }

    public function scopeDraft(Builder $query): Builder { return $query->where('status', 'draft'); }
    public function scopeSelesai(Builder $query): Builder { return $query->where('status', 'selesai'); }
}