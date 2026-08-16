<?php

namespace App\Http\Requests\BahanProduct;

use Illuminate\Foundation\Http\FormRequest;

class StoreBahanProductRequest extends FormRequest
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
                'max:100',
                'min:2',
                'unique:bahan_products,nama',
                'regex:/^[A-Z0-9\s\-\(\)#]+$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama bahan product wajib diisi.',
            'nama.string' => 'Nama harus berupa teks.',
            'nama.max' => 'Nama maksimal 100 karakter.',
            'nama.min' => 'Nama minimal 2 karakter.',
            'nama.unique' => 'Bahan product ini sudah terdaftar.',
            'nama.regex' => 'Nama harus HURUF KAPITAL, boleh mengandung angka, spasi, dan simbol (-, (), #).',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama')) {
            $this->merge([
                'nama' => strtoupper(trim($this->input('nama', ''))),
            ]);
        }
    }
}