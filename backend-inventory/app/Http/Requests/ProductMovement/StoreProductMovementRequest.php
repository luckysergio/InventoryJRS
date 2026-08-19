<?php

namespace App\Http\Requests\ProductMovement;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inventory_id' => ['required', 'integer', 'exists:inventories,id'],
            'tipe'         => ['required', 'string', 'in:in,out,transfer,produksi'],
            'qty'          => ['required', 'integer', 'min:1'],
            'to_place_id'  => ['required_if:tipe,transfer', 'nullable', 'integer', 'exists:places,id'],
            'keterangan'   => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'inventory_id.required'       => 'Inventory wajib dipilih.',
            'inventory_id.exists'         => 'Inventory tidak ditemukan.',
            'tipe.required'               => 'Tipe mutasi wajib dipilih.',
            'tipe.in'                     => 'Tipe mutasi harus salah satu: in, out, transfer, produksi.',
            'qty.required'                => 'Jumlah wajib diisi.',
            'qty.min'                     => 'Jumlah minimal 1.',
            'to_place_id.required_if'     => 'Tempat tujuan wajib diisi untuk transfer.',
            'to_place_id.exists'          => 'Tempat tujuan tidak ditemukan.',
            'keterangan.max'              => 'Keterangan maksimal 255 karakter.',
        ];
    }
}