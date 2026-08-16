<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'ukuran' => $this->ukuran,
            'keterangan' => $this->keterangan,
            'jenis_id' => $this->jenis_id,
            'type_id' => $this->type_id,
            'bahan_id' => $this->bahan_id,
            'distributor_id' => $this->distributor_id,
            'customer_id' => $this->customer_id,
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
            'foto_depan' => $this->foto_depan ?? null,
            'foto_samping' => $this->foto_samping ?? null,
            'foto_atas' => $this->foto_atas ?? null,
            'foto_depan_url' => $this->foto_depan ? asset('storage/' . $this->foto_depan) : null,
            'foto_samping_url' => $this->foto_samping ? asset('storage/' . $this->foto_samping) : null,
            'foto_atas_url' => $this->foto_atas ? asset('storage/' . $this->foto_atas) : null,
            'harga_umum' => $this->whenLoaded('hargaProducts', function () {
                $hargaUmum = $this->hargaProducts->firstWhere('customer_id', null);
                return $hargaUmum?->harga ?? null;
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}