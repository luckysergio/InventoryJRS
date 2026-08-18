<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * @param  Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'tagihan_harian_belum_lunas' => (float) max(0, $this->tagihan_harian_belum_lunas ?? 0),
            'tagihan_pesanan_belum_lunas' => (float) max(0, $this->tagihan_pesanan_belum_lunas ?? 0),
            'total_tagihan' => (float) max(0, ($this->tagihan_harian_belum_lunas ?? 0) + ($this->tagihan_pesanan_belum_lunas ?? 0)),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'can_delete' => true,
            'has_outstanding' => (($this->tagihan_harian_belum_lunas ?? 0) + ($this->tagihan_pesanan_belum_lunas ?? 0)) > 0,
        ];
    }
}