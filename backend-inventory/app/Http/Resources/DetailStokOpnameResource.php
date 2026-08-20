<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetailStokOpnameResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $inventory = $this->inventory;
        $product = $inventory?->product;

        return [
            'id' => $this->id,
            'stok_opname_id' => $this->stok_opname_id,
            'inventory_id' => $this->inventory_id,
            'stok_sistem' => (int) $this->stok_sistem,
            'stok_real' => $this->stok_real !== null ? (int) $this->stok_real : null,
            'selisih' => $this->selisih !== null ? (int) $this->selisih : null,
            'keterangan' => $this->keterangan,
            'product' => $product ? [
                'id' => $product->id,
                'kode' => $product->kode,
                'ukuran' => $product->ukuran,
                'jenis' => $product->jenis ? ['id' => $product->jenis->id, 'nama' => $product->jenis->nama] : null,
                'type' => $product->type ? ['id' => $product->type->id, 'nama' => $product->type->nama] : null,
                'bahan' => $product->bahan ? ['id' => $product->bahan->id, 'nama' => $product->bahan->nama] : null,
            ] : null,
            'place' => $inventory?->place ? [
                'id' => $inventory->place->id,
                'nama' => $inventory->place->nama,
                'kode' => $inventory->place->kode,
            ] : null,
        ];
    }
}