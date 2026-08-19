<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inventory_id' => $this->inventory_id,
            'tipe' => $this->tipe,
            'qty' => (int) $this->qty,
            'keterangan' => $this->keterangan,
            'product' => $this->whenLoaded('inventory', function () {
                $product = $this->inventory?->product;
                if (!$product) return null;
                return [
                    'id' => $product->id,
                    'kode' => $product->kode,
                    'ukuran' => $product->ukuran,
                    'jenis' => $product->jenis ? ['id' => $product->jenis->id, 'nama' => $product->jenis->nama] : null,
                    'type' => $product->type ? ['id' => $product->type->id, 'nama' => $product->type->nama] : null,
                    'bahan' => $product->bahan ? ['id' => $product->bahan->id, 'nama' => $product->bahan->nama] : null,
                ];
            }),
            'place' => $this->whenLoaded('inventory', function () {
                $place = $this->inventory?->place;
                return $place ? ['id' => $place->id, 'nama' => $place->nama, 'kode' => $place->kode] : null;
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}