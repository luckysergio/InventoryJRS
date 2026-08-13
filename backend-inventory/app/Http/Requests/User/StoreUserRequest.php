<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'min:6',
                'regex:/[!_]/',
            ],
            'role'     => ['required', Rule::in(['admin', 'admin_toko', 'operator'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Nama wajib diisi.',
            'name.string'       => 'Nama harus berupa teks.',
            'name.max'          => 'Nama maksimal 100 karakter.',
            
            'email.required'    => 'Email wajib diisi.',
            'email.string'      => 'Email harus berupa teks.',
            'email.email'       => 'Format email tidak valid.',
            'email.max'         => 'Email maksimal 255 karakter.',
            'email.unique'      => 'Email sudah terdaftar.',
            
            'password.required' => 'Password wajib diisi.',
            'password.string'   => 'Password harus berupa teks.',
            'password.min'      => 'Password minimal 6 karakter.',
            'password.regex'    => 'Password wajib mengandung karakter ! atau _',
            
            'role.required'     => 'Role wajib dipilih.',
            'role.in'           => 'Role tidak valid. Pilih: admin, admin_toko, atau operator.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim($this->input('email', ''))),
            'name'  => trim($this->input('name', '')),
        ]);
    }

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        $data['email'] = strtolower(trim($data['email']));
        $data['name'] = trim($data['name']);

        return $data;
    }
}