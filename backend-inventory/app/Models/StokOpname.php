<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StokOpname extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tgl_opname',
        'keterangan',
        'status'
    ];

    protected $casts = [
        'tgl_opname' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function details()
    {
        return $this->hasMany(DetailStokOpname::class);
    }

    public function scopeSelesai($query)
    {
        return $query->where('status', 'selesai');
    }
}
