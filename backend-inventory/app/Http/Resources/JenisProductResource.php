<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JenisProductResource extends JsonResource
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
            'nama' => $data['nama'] ?? null,
            'products_count' => $data['products_count'] ?? 0,
            'types_count' => $data['types_count'] ?? 0,
            'created_at' => $data['created_at'] ?? null,
            'updated_at' => $data['updated_at'] ?? null,
            'can_delete' => ($data['products_count'] ?? 0) === 0 && ($data['types_count'] ?? 0) === 0,
        ];
    }
}