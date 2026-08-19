<?php

namespace App\Http\Requests\Place;

use Illuminate\Foundation\Http\FormRequest;

class StorePlaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama'       => ['required', 'string', 'max:100', 'min:2'],
            'kode'       => ['required', 'string', 'max:20', 'unique:places,kode', 'regex:/^[A-Z0-9_\-]+$/'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required'       => 'Nama tempat wajib diisi.',
            'nama.min'            => 'Nama minimal 2 karakter.',
            'nama.max'            => 'Nama maksimal 100 karakter.',
            'kode.required'       => 'Kode tempat wajib diisi.',
            'kode.unique'         => 'Kode tempat sudah digunakan.',
            'kode.regex'          => 'Kode hanya boleh huruf kapital, angka, underscore, dan strip.',
            'kode.max'            => 'Kode maksimal 20 karakter.',
            'keterangan.max'      => 'Keterangan maksimal 255 karakter.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('nama')) {
            $data['nama'] = trim($this->input('nama'));
        }
        if ($this->has('kode')) {
            $data['kode'] = strtoupper(trim($this->input('kode')));
        }
        if ($this->has('keterangan') && $this->input('keterangan')) {
            $data['keterangan'] = trim($this->input('keterangan'));
        }
        if (!empty($data)) {
            $this->merge($data);
        }
    }
}