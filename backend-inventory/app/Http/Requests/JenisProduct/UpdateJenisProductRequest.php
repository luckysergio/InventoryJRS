<?php

namespace App\Http\Requests\JenisProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJenisProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $jenisId = $this->route('jenis_product')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:255',
                Rule::unique('jenis_products', 'nama')->ignore($jenisId),
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