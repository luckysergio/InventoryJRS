<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/^[\p{L}\s\-\.]+$/',
            ],
            'email' => [
                'required',
                'string',
                'email:rfc,dns',
                'max:255',
                'unique:users,email',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'max:255',
                'regex:/[!_@#$%^&*]/',
                'regex:/[a-zA-Z]/',
                'regex:/[0-9]/',
            ],
            'role' => [
                'required',
                Rule::in(['admin', 'admin_toko', 'operator']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa teks.',
            'name.max' => 'Nama maksimal 100 karakter.',
            'name.regex' => 'Nama hanya boleh mengandung huruf, spasi, strip, dan titik.',

            'email.required' => 'Email wajib diisi.',
            'email.string' => 'Email harus berupa teks.',
            'email.email' => 'Format email tidak valid.',
            'email.max' => 'Email maksimal 255 karakter.',
            'email.unique' => 'Email sudah terdaftar.',

            'password.required' => 'Password wajib diisi.',
            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.max' => 'Password maksimal 255 karakter.',
            'password.regex' => 'Password wajib mengandung huruf, angka, dan karakter spesial (! _ @ # $ % ^ & *).',

            'role.required' => 'Role wajib dipilih.',
            'role.in' => 'Role tidak valid. Pilih: admin, admin_toko, atau operator.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim($this->input('email', ''))),
            'name' => trim($this->input('name', '')),
        ]);
    }
}