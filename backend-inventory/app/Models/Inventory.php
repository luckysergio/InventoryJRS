<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventory extends Model
{
    protected $fillable = ['product_id', 'place_id', 'qty'];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
        ];
    }

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function place(): BelongsTo { return $this->belongsTo(Place::class); }
    public function movements(): HasMany { return $this->hasMany(ProductMovement::class); }
}