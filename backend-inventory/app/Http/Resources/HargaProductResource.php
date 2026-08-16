<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HargaProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : $this->resource->toArray();

        return [
            'id' => $data['id'] ?? null,
            'product_id' => $data['product_id'] ?? null,
            'customer_id' => $data['customer_id'] ?? null,
            'harga' => $data['harga'] ?? 0,
            'tanggal_berlaku' => $data['tanggal_berlaku'] ?? null,
            'keterangan' => $data['keterangan'] ?? null,
            'product' => $data['product'] ?? null,
            'customer' => $data['customer'] ?? null,
            'created_at' => $data['created_at'] ?? null,
            'updated_at' => $data['updated_at'] ?? null,
            'is_customer_specific' => ($data['customer_id'] ?? null) !== null,
            'formatted_harga' => number_format($data['harga'] ?? 0, 0, ',', '.'),
        ];
    }
}