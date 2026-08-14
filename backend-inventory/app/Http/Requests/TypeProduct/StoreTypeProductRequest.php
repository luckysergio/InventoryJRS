<?php

namespace App\Http\Requests\TypeProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTypeProductRequest extends FormRequest
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
                Rule::unique('type_products', 'nama')->where('jenis_id', $this->jenis_id),
                'regex:/^[A-Z0-9\s\-\(\)#]+$/',
            ],
            'jenis_id' => ['required', 'integer', 'exists:jenis_products,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.regex'  => 'Nama harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'nama.unique' => 'Type ini sudah ada pada jenis yang dipilih.',
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