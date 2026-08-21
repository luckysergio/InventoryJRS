<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PesananTransaksiDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $hasPembayarans = $this->resource->relationLoaded('pembayarans');
        $pembayarans = $hasPembayarans ? $this->pembayarans : collect([]);

        $totalBayar = (float) $pembayarans->sum('jumlah_bayar');
        $sisaTagihan = (float) $this->subtotal - $totalBayar;

        $data = [
            'id'                  => $this->id,
            'transaksi_id'        => $this->transaksi_id,
            'product_id'          => $this->product_id,
            'status_transaksi_id' => $this->status_transaksi_id,
            'qty'                 => (int) $this->qty,
            'harga'               => (float) $this->harga,
            'subtotal'            => (float) $this->subtotal,
            'discount'            => (float) $this->discount,
            'catatan'             => $this->catatan,
            'total_bayar'         => $totalBayar,
            'sisa_tagihan'        => $sisaTagihan,
            'status_lunas'        => $sisaTagihan <= 0,
            'created_at'          => $this->created_at?->toISOString(),
            'updated_at'          => $this->updated_at?->toISOString(),
        ];

        if ($this->resource->relationLoaded('product') && $this->product) {
            $data['product'] = [
                'id'    => $this->product->id,
                'kode'  => $this->product->kode,
                'ukuran' => $this->product->ukuran,
                'jenis' => $this->product->jenis ? [
                    'id'   => $this->product->jenis->id,
                    'nama' => $this->product->jenis->nama,
                ] : null,
                'type' => $this->product->type ? [
                    'id'   => $this->product->type->id,
                    'nama' => $this->product->type->nama,
                ] : null,
                'bahan' => $this->product->bahan ? [
                    'id'   => $this->product->bahan->id,
                    'nama' => $this->product->bahan->nama,
                ] : null,
            ];
        }

        if ($this->resource->relationLoaded('statusTransaksi') && $this->statusTransaksi) {
            $data['status_transaksi'] = [
                'id'   => $this->statusTransaksi->id,
                'nama' => $this->statusTransaksi->nama,
            ];
        }

        if ($hasPembayarans) {
            $data['pembayarans'] = $pembayarans->map(fn($p) => [
                'id'           => $p->id,
                'jumlah_bayar' => (float) $p->jumlah_bayar,
                'tanggal_bayar' => $p->tanggal_bayar?->format('Y-m-d'),
            ])->values();
        }

        return $data;
    }
}