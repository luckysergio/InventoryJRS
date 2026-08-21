<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;
        $transaksiDetail = $this->transaksiDetail;
        $transaksi = $transaksiDetail?->transaksi;
        $customer = $transaksi?->customer;

        return [
            'id'                => $this->id,
            'product_id'        => $this->product_id,
            'karyawan_id'       => $this->karyawan_id,
            'transaksi_detail_id' => $this->transaksi_detail_id,
            'jenis_pembuatan'   => $this->jenis_pembuatan,
            'qty'               => (int) $this->qty,
            'status'            => $this->status,
            'tanggal_mulai'     => $this->tanggal_mulai?->toISOString(),
            'tanggal_selesai'   => $this->tanggal_selesai?->toISOString(),
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at'        => $this->updated_at?->toISOString(),

            'product' => $this->whenLoaded('product', fn() => [
                'id' => $product->id,
                'kode' => $product->kode,
                'ukuran' => $product->ukuran,
                'jenis' => $product->jenis ? ['id' => $product->jenis->id, 'nama' => $product->jenis->nama] : null,
                'type' => $product->type ? ['id' => $product->type->id, 'nama' => $product->type->nama] : null,
                'bahan' => $product->bahan ? ['id' => $product->bahan->id, 'nama' => $product->bahan->nama] : null,
                'foto_urls' => [
                    'depan'   => $product->foto_depan ? asset('storage/' . $product->foto_depan) : null,
                    'samping' => $product->foto_samping ? asset('storage/' . $product->foto_samping) : null,
                    'atas'    => $product->foto_atas ? asset('storage/' . $product->foto_atas) : null,
                ],
            ]),

            'karyawan' => $this->whenLoaded('karyawan', fn() => [
                'id' => $this->karyawan->id,
                'nama' => $this->karyawan->nama,
            ]),

            'transaksi_detail' => $this->whenLoaded('transaksiDetail', fn() => [
                'id' => $transaksiDetail->id,
                'qty' => (int) $transaksiDetail->qty,
                'status_transaksi' => $transaksiDetail->statusTransaksi ? [
                    'id' => $transaksiDetail->statusTransaksi->id,
                    'nama' => $transaksiDetail->statusTransaksi->nama,
                ] : null,
            ]),

            'transaksi' => $transaksi ? [
                'id' => $transaksi->id,
                'kode' => $transaksi->kode,
                'tanggal' => $transaksi->tanggal,
                'jenis_transaksi' => $transaksi->jenis_transaksi,
                'customer' => $customer ? [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                ] : null,
            ] : null,
        ];
    }
}