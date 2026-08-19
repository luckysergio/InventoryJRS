<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'place_id' => $this->place_id,
            'qty' => (int) $this->qty,
            'product' => $this->whenLoaded('product', function () {
                $p = $this->product;
                if (!$p) return null;
                return [
                    'id' => $p->id,
                    'kode' => $p->kode,
                    'ukuran' => $p->ukuran,
                    'keterangan' => $p->keterangan,
                    'jenis' => $p->jenis ? ['id' => $p->jenis->id, 'nama' => $p->jenis->nama] : null,
                    'type' => $p->type ? ['id' => $p->type->id, 'nama' => $p->type->nama] : null,
                    'bahan' => $p->bahan ? ['id' => $p->bahan->id, 'nama' => $p->bahan->nama] : null,
                ];
            }),
            'place' => $this->whenLoaded('place', function () {
                $pl = $this->place;
                return $pl ? ['id' => $pl->id, 'nama' => $pl->nama, 'kode' => $pl->kode] : null;
            }),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}