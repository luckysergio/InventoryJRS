<?php

namespace App\Http\Requests\Pembayaran;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePembayaranRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'jumlah_bayar'  => 'sometimes|numeric|min:0',
            'tanggal_bayar' => 'sometimes|date',
        ];
    }
}