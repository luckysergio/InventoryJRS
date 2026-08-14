<?php

namespace App\Http\Requests\Jabatan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJabatanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // ✅ Ambil ID dengan fallback agar aman baik parameter bernama 'jabatan' atau 'id'
        $jabatanId = $this->route('jabatan')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:100',
                Rule::unique('jabatans', 'nama')->ignore($jabatanId),
                'regex:/^[A-Z\s]+$/',
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