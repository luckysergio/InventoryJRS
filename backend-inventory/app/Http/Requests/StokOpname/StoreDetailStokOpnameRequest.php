<?php

namespace App\Http\Requests\StokOpname;

use Illuminate\Foundation\Http\FormRequest;

class StoreDetailStokOpnameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inventory_id' => ['required', 'integer', 'exists:inventories,id'],
            'stok_real'    => ['nullable', 'integer', 'min:0', 'max:999999'],
            'keterangan'   => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'inventory_id.required' => 'Inventory wajib dipilih.',
            'inventory_id.exists'   => 'Inventory tidak ditemukan.',
            'stok_real.integer'     => 'Stok real harus berupa angka.',
            'stok_real.min'         => 'Stok real minimal 0.',
            'stok_real.max'         => 'Stok real terlalu besar.',
            'keterangan.max'        => 'Keterangan maksimal 255 karakter.',
        ];
    }
}