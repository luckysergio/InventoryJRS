<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatusTransaksi extends Model
{
    protected $fillable = ['nama'];

    public function transaksiDetails()
    {
        return $this->hasMany(TransaksiDetail::class, 'status_transaksi_id');
    }
}
