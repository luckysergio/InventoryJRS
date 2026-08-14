<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = (int) $this->route('id');

        return [
            'name'     => ['sometimes', 'required', 'string', 'max:100'],
            'email'    => [
                'sometimes', 'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['nullable', 'string', 'min:6', 'regex:/[!_]/'],
            'role'     => ['sometimes', 'required', Rule::in(['admin', 'admin_toko', 'operator'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Nama wajib diisi.',
            'email.email'    => 'Format email tidak valid.',
            'email.unique'   => 'Email sudah terdaftar.',
            'password.min'   => 'Password minimal 6 karakter.',
            'password.regex' => 'Password wajib mengandung karakter ! atau _',
            'role.in'        => 'Role tidak valid. Pilih: admin, admin_toko, atau operator.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('email')) {
            $data['email'] = strtolower(trim($this->input('email', '')));
        }
        if ($this->has('name')) {
            $data['name'] = trim($this->input('name', ''));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}