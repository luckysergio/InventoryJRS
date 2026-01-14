<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Karyawan extends Model
{
    protected $fillable = ['nama', 'no_hp', 'email', 'jabatan_id'];

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class);
    }

    public function productions()
    {
        return $this->hasMany(Production::class);
    }
}
