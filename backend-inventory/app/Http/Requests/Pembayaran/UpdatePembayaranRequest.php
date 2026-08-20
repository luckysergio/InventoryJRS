<?php

namespace App\Http\Requests\Pembayaran;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePembayaranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jumlah_bayar'  => ['sometimes', 'numeric', 'min:1', 'max:999999999'],
            'tanggal_bayar' => ['sometimes', 'date', 'before_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'jumlah_bayar.numeric'         => 'Jumlah bayar harus berupa angka.',
            'jumlah_bayar.min'             => 'Jumlah bayar minimal Rp 1.',
            'jumlah_bayar.max'             => 'Jumlah bayar terlalu besar.',
            'tanggal_bayar.date'           => 'Format tanggal tidak valid.',
            'tanggal_bayar.before_or_equal'=> 'Tanggal bayar tidak boleh di masa depan.',
        ];
    }
}