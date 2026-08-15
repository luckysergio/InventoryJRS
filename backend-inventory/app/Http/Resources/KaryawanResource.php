<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KaryawanResource extends JsonResource
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
            'no_hp' => $data['no_hp'] ?? null,
            'email' => $data['email'] ?? null,
            'jabatan_id' => $data['jabatan_id'] ?? null,
            'jabatan' => $data['jabatan'] ?? null,
            'created_at' => $data['created_at'] ?? null,
            'updated_at' => $data['updated_at'] ?? null,
        ];
    }
}