<?php

namespace App\Http\Requests\Pembayaran;

use Illuminate\Foundation\Http\FormRequest;

class StorePembayaranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transaksi_detail_id' => ['required', 'integer', 'exists:transaksi_details,id'],
            'jumlah_bayar'        => ['required', 'numeric', 'min:1', 'max:999999999'],
            'tanggal_bayar'       => ['required', 'date', 'before_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'transaksi_detail_id.required' => 'Detail transaksi wajib dipilih.',
            'transaksi_detail_id.exists'   => 'Detail transaksi tidak ditemukan.',
            'jumlah_bayar.required'        => 'Jumlah bayar wajib diisi.',
            'jumlah_bayar.numeric'         => 'Jumlah bayar harus berupa angka.',
            'jumlah_bayar.min'             => 'Jumlah bayar minimal Rp 1.',
            'jumlah_bayar.max'             => 'Jumlah bayar terlalu besar.',
            'tanggal_bayar.required'       => 'Tanggal bayar wajib diisi.',
            'tanggal_bayar.date'           => 'Format tanggal tidak valid.',
            'tanggal_bayar.before_or_equal'=> 'Tanggal bayar tidak boleh di masa depan.',
        ];
    }
}