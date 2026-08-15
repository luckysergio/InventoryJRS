<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $targetUser = User::find($this->route('id'));
        
        if (!$targetUser) {
            return false;
        }

        if ($this->user()->isAdmin()) {
            return true;
        }

        return $this->user()->id === $targetUser->id;
    }

    public function rules(): array
    {
        $userId = (int) $this->route('id');
        $targetUser = User::find($userId);

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'regex:/^[\p{L}\s\-\.]+$/',
            ],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email:rfc,dns',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => [
                'nullable',
                'string',
                'min:8',
                'max:255',
                'regex:/[!_@#$%^&*]/',
                'regex:/[a-zA-Z]/',
                'regex:/[0-9]/',
            ],
            'role' => [
                'sometimes',
                'required',
                Rule::in(['admin', 'admin_toko', 'operator']),
                $this->user()->isAdmin() ? '' : Rule::prohibited(),
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

            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.max' => 'Password maksimal 255 karakter.',
            'password.regex' => 'Password wajib mengandung huruf, angka, dan karakter spesial (! _ @ # $ % ^ & *).',

            'role.required' => 'Role wajib dipilih.',
            'role.in' => 'Role tidak valid. Pilih: admin, admin_toko, atau operator.',
            'role.prohibited' => 'Anda tidak memiliki izin untuk mengubah role.',
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