<?php

namespace App\Http\Requests\Pembayaran;

use Illuminate\Foundation\Http\FormRequest;

class StorePembayaranRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'transaksi_detail_id' => 'required|exists:transaksi_details,id',
            'jumlah_bayar'        => 'required|numeric|min:0',
            'tanggal_bayar'       => 'required|date',
        ];
    }

    public function messages(): array
    {
        return [
            'transaksi_detail_id.exists' => 'Detail transaksi tidak ditemukan.',
            'jumlah_bayar.min'           => 'Jumlah bayar minimal 0.',
            'jumlah_bayar.required'      => 'Jumlah bayar wajib diisi.',
            'tanggal_bayar.required'     => 'Tanggal bayar wajib diisi.',
        ];
    }
}