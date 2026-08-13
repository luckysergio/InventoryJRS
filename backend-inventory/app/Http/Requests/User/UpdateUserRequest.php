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
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [
                'nullable',
                'string',
                'min:6',
                'regex:/[!_]/',
            ],
            'role'     => ['sometimes', 'required', Rule::in(['admin', 'admin_toko', 'operator'])],
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
            
            'password.string'   => 'Password harus berupa teks.',
            'password.min'      => 'Password minimal 6 karakter.',
            'password.regex'    => 'Password wajib mengandung karakter ! atau _',
            
            'role.required'     => 'Role wajib dipilih.',
            'role.in'           => 'Role tidak valid. Pilih: admin, admin_toko, atau operator.',
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

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if (isset($data['email'])) {
            $data['email'] = strtolower(trim($data['email']));
        }

        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        return $data;
    }
}