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
        $jenisId = $this->route('jenisProduct')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:100',
                'min:2',
                Rule::unique('jenis_products', 'nama')->ignore($jenisId),
                'regex:/^[A-Z0-9\s\-]+$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama jenis produk wajib diisi.',
            'nama.string' => 'Nama harus berupa teks.',
            'nama.max' => 'Nama maksimal 100 karakter.',
            'nama.min' => 'Nama minimal 2 karakter.',
            'nama.unique' => 'Jenis produk ini sudah terdaftar.',
            'nama.regex' => 'Nama harus HURUF KAPITAL, boleh mengandung angka, spasi, dan strip.',
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