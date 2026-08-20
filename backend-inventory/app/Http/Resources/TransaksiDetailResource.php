<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransaksiDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $hasProduct = $this->resource->relationLoaded('product');
        $hasPembayarans = $this->resource->relationLoaded('pembayarans');

        $product = $hasProduct ? $this->product : null;
        $pembayarans = $hasPembayarans ? $this->pembayarans : collect([]);

        $totalBayar = $pembayarans->sum('jumlah_bayar');
        $sisaTagihan = (float) $this->subtotal - (float) $totalBayar;

        $data = [
            'id' => $this->id,
            'transaksi_id' => $this->transaksi_id,
            'product_id' => $this->product_id,
            'harga_product_id' => $this->harga_product_id,
            'status_transaksi_id' => $this->status_transaksi_id,
            'qty' => (int) $this->qty,
            'harga' => (float) $this->harga,
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'catatan' => $this->catatan,
            'total_bayar' => (float) $totalBayar,
            'sisa_tagihan' => (float) $sisaTagihan,
            'status_lunas' => $sisaTagihan <= 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        if ($hasProduct && $product) {
            $data['product'] = [
                'id' => $product->id,
                'kode' => $product->kode,
                'ukuran' => $product->ukuran,
                'jenis' => $product->jenis ? ['id' => $product->jenis->id, 'nama' => $product->jenis->nama] : null,
                'type' => $product->type ? ['id' => $product->type->id, 'nama' => $product->type->nama] : null,
                'bahan' => $product->bahan ? ['id' => $product->bahan->id, 'nama' => $product->bahan->nama] : null,
            ];
        }

        if ($this->resource->relationLoaded('statusTransaksi')) {
            $data['status_transaksi'] = $this->statusTransaksi ? [
                'id' => $this->statusTransaksi->id,
                'nama' => $this->statusTransaksi->nama,
            ] : null;
        }

        if ($hasPembayarans) {
            $data['pembayarans'] = PembayaranResource::collection($pembayarans);
        }

        return $data;
    }
}