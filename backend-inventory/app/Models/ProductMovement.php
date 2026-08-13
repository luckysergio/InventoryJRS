<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProductMovement extends Model
{
    protected $fillable = [
        'inventory_id', 'tipe', 'qty', 'ref_type', 'ref_id', 'keterangan'
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
        ];
    }

    public function inventory(): BelongsTo { return $this->belongsTo(Inventory::class); }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}