<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'ukuran' => $this->ukuran,
            'keterangan' => $this->keterangan,
            'customer_id' => $this->customer_id,
            'jenis_id' => $this->jenis_id,
            'type_id' => $this->type_id,
            'bahan_id' => $this->bahan_id,
            'customer' => $this->whenLoaded('customer', fn() => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
            ]),
            'jenis' => $this->whenLoaded('jenis', fn() => [
                'id' => $this->jenis->id,
                'nama' => $this->jenis->nama,
            ]),
            'type' => $this->whenLoaded('type', fn() => [
                'id' => $this->type->id,
                'nama' => $this->type->nama,
            ]),
            'bahan' => $this->whenLoaded('bahan', fn() => [
                'id' => $this->bahan->id,
                'nama' => $this->bahan->nama,
            ]),
            'harga' => $this->whenLoaded('hargaProducts', function () {
                $harga = $this->hargaProducts->first();
                return $harga?->harga ?? null;
            }),
            'foto_depan' => $this->foto_depan ?? null,
            'foto_samping' => $this->foto_samping ?? null,
            'foto_atas' => $this->foto_atas ?? null,
            'foto_depan_url' => $this->foto_depan ? asset('storage/' . $this->foto_depan) : null,
            'foto_samping_url' => $this->foto_samping ? asset('storage/' . $this->foto_samping) : null,
            'foto_atas_url' => $this->foto_atas ? asset('storage/' . $this->foto_atas) : null,
            'qty_toko' => $this->resource->qty_toko ?? 0,
            'qty_bengkel' => $this->resource->qty_bengkel ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}