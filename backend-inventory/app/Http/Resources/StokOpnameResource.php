<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StokOpnameResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'role' => $this->user->role,
            ]),
            'tgl_opname' => $this->tgl_opname?->format('Y-m-d'),
            'keterangan' => $this->keterangan,
            'status' => $this->status,
            'total_items' => $this->whenCounted('details'),
            'total_selisih' => $this->whenLoaded('details', fn() => 
                $this->details->sum('selisih')
            ),
            'details' => DetailStokOpnameResource::collection($this->whenLoaded('details')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}