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
            'nama' => [
                'required',
                'string',
                'max:255',
                'min:2',
                'regex:/^[\p{L}\s\-.]+$/u',
            ],
            'no_hp' => [
                'required',
                'string',
                'max:20',
                'min:8',
                'regex:/^[0-9+\-\s()]+$/',
            ],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                Rule::unique('karyawans', 'email')->ignore($karyawanId),
            ],
            'jabatan_id' => [
                'nullable',
                'integer',
                'exists:jabatans,id',
            ],
            'jabatan_nama' => [
                'nullable',
                'string',
                'max:100',
                'min:2',
                'unique:jabatans,nama',
                'regex:/^[\p{L}\s]+$/u',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama wajib diisi.',
            'nama.min' => 'Nama minimal 2 karakter.',
            'nama.regex' => 'Nama hanya boleh huruf, spasi, strip, dan titik.',

            'no_hp.required' => 'Nomor HP wajib diisi.',
            'no_hp.min' => 'Nomor HP minimal 8 karakter.',
            'no_hp.regex' => 'Nomor HP hanya boleh angka, +, -, spasi, dan kurung.',

            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah terdaftar.',

            'jabatan_id.exists' => 'Jabatan tidak ditemukan.',

            'jabatan_nama.regex' => 'Nama jabatan hanya boleh huruf dan spasi.',
            'jabatan_nama.unique' => 'Nama jabatan sudah terdaftar.',
            'jabatan_nama.min' => 'Nama jabatan minimal 2 karakter.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('email')) {
            $data['email'] = strtolower(trim($this->input('email', '')));
        }

        if ($this->has('nama')) {
            $data['nama'] = trim($this->input('nama', ''));
        }

        if ($this->has('no_hp')) {
            $data['no_hp'] = preg_replace('/[^0-9+]/', '', $this->input('no_hp', ''));
        }

        if ($this->has('jabatan_nama') && $this->input('jabatan_nama')) {
            $data['jabatan_nama'] = strtoupper(trim($this->input('jabatan_nama')));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}