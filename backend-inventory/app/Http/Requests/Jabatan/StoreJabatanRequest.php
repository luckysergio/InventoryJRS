<?php

namespace App\Http\Requests\Jabatan;

use Illuminate\Foundation\Http\FormRequest;

class StoreJabatanRequest extends FormRequest
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
                'unique:jabatans,nama',
                'regex:/^[A-Z\s]+$/', // Hanya huruf kapital dan spasi
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.regex'  => 'Nama jabatan harus menggunakan HURUF KAPITAL semua.',
            'nama.unique' => 'Nama jabatan sudah terdaftar.',
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