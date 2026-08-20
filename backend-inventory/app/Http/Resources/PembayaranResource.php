<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PembayaranResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $detail = $this->transaksiDetail;
        $transaksi = $detail?->transaksi;
        $product = $detail?->product;

        return [
            'id' => $this->id,
            'transaksi_detail_id' => $this->transaksi_detail_id,
            'jumlah_bayar' => (float) $this->jumlah_bayar,
            'tanggal_bayar' => $this->tanggal_bayar?->format('Y-m-d'),
            'transaksi_detail' => $detail ? [
                'id' => $detail->id,
                'qty' => (int) $detail->qty,
                'harga' => (float) $detail->harga,
                'subtotal' => (float) $detail->subtotal,
                'product' => $product ? [
                    'id' => $product->id,
                    'kode' => $product->kode,
                    'ukuran' => $product->ukuran,
                    'jenis' => $product->jenis ? ['id' => $product->jenis->id, 'nama' => $product->jenis->nama] : null,
                    'type' => $product->type ? ['id' => $product->type->id, 'nama' => $product->type->nama] : null,
                    'bahan' => $product->bahan ? ['id' => $product->bahan->id, 'nama' => $product->bahan->nama] : null,
                ] : null,
                'transaksi' => $transaksi ? [
                    'id' => $transaksi->id,
                    'kode' => $transaksi->kode,
                    'tanggal' => $transaksi->tanggal?->format('Y-m-d'),
                    'customer' => $transaksi->customer ? [
                        'id' => $transaksi->customer->id,
                        'name' => $transaksi->customer->name,
                    ] : null,
                ] : null,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}