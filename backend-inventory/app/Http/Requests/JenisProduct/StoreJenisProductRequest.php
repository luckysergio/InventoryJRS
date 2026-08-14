<?php

namespace App\Http\Requests\JenisProduct;

use Illuminate\Foundation\Http\FormRequest;

class StoreJenisProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => [
                'required',
                'string',
                'max:255',
                'unique:jenis_products,nama',
                'regex:/^[A-Z0-9\s]+$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.regex'  => 'Nama harus menggunakan HURUF KAPITAL dan boleh mengandung ANGKA.',
            'nama.unique' => 'Jenis product ini sudah terdaftar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama')) {
            $this->merge([
                'nama' => strtoupper(trim($this->input('nama'))),
            ]);
        }
    }
}