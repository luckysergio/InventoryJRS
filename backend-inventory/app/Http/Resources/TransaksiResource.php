<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransaksiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $hasDetails = $this->resource->relationLoaded('details');
        $details = $hasDetails ? $this->details : collect([]);

        $totalBayar = $details->sum(fn($d) => $d->pembayarans ? $d->pembayarans->sum('jumlah_bayar') : 0);
        $sisaTagihan = (float) $this->total - (float) $totalBayar;

        $data = [
            'id' => $this->id,
            'kode' => $this->kode,
            'customer_id' => $this->customer_id,
            'jenis_transaksi' => $this->jenis_transaksi,
            'tanggal' => $this->tanggal?->format('Y-m-d'),
            'total' => (float) $this->total,
            'total_bayar' => (float) $totalBayar,
            'sisa_tagihan' => (float) $sisaTagihan,
            'status_lunas' => $sisaTagihan <= 0,
            'total_items' => $details->count(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        if ($this->resource->relationLoaded('customer')) {
            $data['customer'] = $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone ?? null,
            ] : null;
        }

        if ($hasDetails) {
            $data['details'] = TransaksiDetailResource::collection($details);
        }

        return $data;
    }
}