<?php

namespace App\Http\Requests\StokOpname;

use Illuminate\Foundation\Http\FormRequest;

class StoreStokOpnameForPlacesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tgl_opname'     => ['required', 'date', 'before_or_equal:today'],
            'keterangan'     => ['nullable', 'string', 'max:500'],
            'place_kodes'    => ['nullable', 'array', 'min:1'],
            'place_kodes.*'  => ['string', 'in:TOKO,BENGKEL'],
        ];
    }

    public function messages(): array
    {
        return [
            'tgl_opname.required'        => 'Tanggal opname wajib diisi.',
            'tgl_opname.date'            => 'Format tanggal tidak valid.',
            'tgl_opname.before_or_equal' => 'Tanggal opname tidak boleh di masa depan.',
            'keterangan.max'             => 'Keterangan maksimal 500 karakter.',
            'place_kodes.array'          => 'Place harus berupa array.',
            'place_kodes.min'            => 'Pilih minimal 1 place.',
            'place_kodes.*.in'           => 'Place hanya boleh TOKO atau BENGKEL.',
        ];
    }
}