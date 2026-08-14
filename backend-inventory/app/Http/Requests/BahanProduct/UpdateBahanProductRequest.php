<?php

namespace App\Http\Requests\BahanProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBahanProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $bahanId = $this->route('bahan_product')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:255',
                Rule::unique('bahan_products', 'nama')->ignore($bahanId),
                'regex:/^[A-Z0-9\s\-\(\)#]+$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.regex'  => 'Nama harus menggunakan HURUF KAPITAL dan boleh mengandung angka atau karakter (-, (), #).',
            'nama.unique' => 'Bahan product ini sudah terdaftar.',
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