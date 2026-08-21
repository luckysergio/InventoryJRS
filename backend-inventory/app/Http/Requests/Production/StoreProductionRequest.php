<?php

namespace App\Http\Requests\Production;

use App\Services\Production\ProductionService;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'karyawan_id'         => ['required', 'integer', 'exists:karyawans,id'],
            'jenis_pembuatan'     => ['required', 'in:' . ProductionService::JENIS_PESANAN . ',' . ProductionService::JENIS_INVENTORY],

            // Required for pesanan
            'transaksi_detail_id' => ['required_if:jenis_pembuatan,' . ProductionService::JENIS_PESANAN, 'nullable', 'integer', 'exists:transaksi_details,id'],

            // Required for inventory
            'product_id'          => ['required_if:jenis_pembuatan,' . ProductionService::JENIS_INVENTORY, 'nullable', 'integer', 'exists:products,id'],
            'qty'                 => ['required_if:jenis_pembuatan,' . ProductionService::JENIS_INVENTORY, 'nullable', 'integer', 'min:1'],

            'tanggal_mulai'       => ['required', 'date'],
            'tanggal_selesai'     => ['required', 'date', 'after_or_equal:tanggal_mulai'],
        ];
    }

    public function messages(): array
    {
        return [
            'karyawan_id.required'        => 'Karyawan wajib dipilih.',
            'karyawan_id.exists'          => 'Karyawan tidak ditemukan.',
            'jenis_pembuatan.required'    => 'Jenis pembuatan wajib dipilih.',
            'jenis_pembuatan.in'          => 'Jenis pembuatan harus "pesanan" atau "inventory".',
            'transaksi_detail_id.required_if' => 'Transaksi detail wajib dipilih untuk jenis pesanan.',
            'transaksi_detail_id.exists'  => 'Transaksi detail tidak ditemukan.',
            'product_id.required_if'      => 'Produk wajib dipilih untuk jenis inventory.',
            'product_id.exists'           => 'Produk tidak ditemukan.',
            'qty.required_if'             => 'Jumlah produksi wajib diisi untuk jenis inventory.',
            'qty.min'                     => 'Jumlah minimal 1.',
            'tanggal_mulai.required'      => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date'          => 'Format tanggal mulai tidak valid.',
            'tanggal_selesai.required'    => 'Tanggal selesai wajib diisi.',
            'tanggal_selesai.date'        => 'Format tanggal selesai tidak valid.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus >= tanggal mulai.',
        ];
    }
}