<?php

namespace App\Http\Requests\Distributor;

use Illuminate\Foundation\Http\FormRequest;

class StoreDistributorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama'  => ['required', 'string', 'max:255', 'min:2'],
            'no_hp' => ['required', 'string', 'max:20', 'min:8'],
            'email' => ['nullable', 'email:rfc,dns', 'max:255', 'unique:distributors,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required'  => 'Nama distributor wajib diisi.',
            'nama.min'       => 'Nama minimal 2 karakter.',
            'no_hp.required' => 'No HP wajib diisi.',
            'no_hp.min'      => 'No HP minimal 8 karakter.',
            'email.email'    => 'Format email tidak valid.',
            'email.unique'   => 'Email distributor ini sudah terdaftar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('nama')) {
            $data['nama'] = trim($this->input('nama', ''));
        }
        if ($this->has('email') && $this->input('email')) {
            $data['email'] = strtolower(trim($this->input('email')));
        }
        if ($this->has('no_hp')) {
            $data['no_hp'] = trim($this->input('no_hp', ''));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}