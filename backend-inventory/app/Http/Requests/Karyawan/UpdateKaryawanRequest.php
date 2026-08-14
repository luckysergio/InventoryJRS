<?php

namespace App\Http\Requests\Karyawan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKaryawanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $karyawanId = $this->route('karyawan')?->id ?? (int) $this->route('id');

        return [
            'nama'         => ['required', 'string', 'max:255'],
            'no_hp'        => ['required', 'string', 'max:20'],
            'email'        => ['required', 'email', 'max:255', Rule::unique('karyawans', 'email')->ignore($karyawanId)],
            'jabatan_id'   => ['nullable', 'integer', 'exists:jabatans,id'],
            'jabatan_nama' => [
                'nullable',
                'string',
                'max:100',
                'unique:jabatans,nama',
                'regex:/^[A-Z\s]+$/'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'jabatan_nama.regex'  => 'Nama jabatan baru harus menggunakan HURUF KAPITAL semua.',
            'jabatan_nama.unique' => 'Nama jabatan baru sudah terdaftar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('jabatan_nama')) {
            $this->merge([
                'jabatan_nama' => strtoupper(trim($this->input('jabatan_nama'))),
            ]);
        }
    }
}