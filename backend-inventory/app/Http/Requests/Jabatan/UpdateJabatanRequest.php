<?php

namespace App\Http\Requests\Jabatan;

use App\Models\Jabatan;
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
        $jabatanId = $this->route('jabatan')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:100',
                'min:2',
                Rule::unique('jabatans', 'nama')->ignore($jabatanId),
                'regex:/^[\p{L}\s]+$/u',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama jabatan wajib diisi.',
            'nama.string' => 'Nama jabatan harus berupa teks.',
            'nama.max' => 'Nama jabatan maksimal 100 karakter.',
            'nama.min' => 'Nama jabatan minimal 2 karakter.',
            'nama.unique' => 'Nama jabatan sudah terdaftar.',
            'nama.regex' => 'Nama jabatan hanya boleh mengandung huruf dan spasi.',
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