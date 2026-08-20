<?php

namespace App\Http\Requests\StokOpname;

use Illuminate\Foundation\Http\FormRequest;

class StoreStokOpnameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tgl_opname'      => ['required', 'date', 'before_or_equal:today'],
            'keterangan'      => ['nullable', 'string', 'max:500'],
            'inventory_ids'   => ['required', 'array', 'min:1'],
            'inventory_ids.*' => ['integer', 'exists:inventories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'tgl_opname.required'          => 'Tanggal opname wajib diisi.',
            'tgl_opname.date'              => 'Format tanggal tidak valid.',
            'tgl_opname.before_or_equal'   => 'Tanggal opname tidak boleh di masa depan.',
            'keterangan.max'               => 'Keterangan maksimal 500 karakter.',
            'inventory_ids.required'       => 'Pilih minimal 1 inventory.',
            'inventory_ids.array'          => 'Inventory harus berupa array.',
            'inventory_ids.min'            => 'Pilih minimal 1 inventory.',
            'inventory_ids.*.exists'       => 'Salah satu inventory tidak ditemukan.',
        ];
    }
}