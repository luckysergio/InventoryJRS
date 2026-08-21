<?php

namespace App\Http\Requests\Pesanan;

class UpdatePesananRequest extends StorePesananRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'details.*.id' => 'nullable|integer|exists:transaksi_details,id',
        ]);
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'details.*.id.exists' => 'Detail pesanan tidak valid.',
        ]);
    }
}