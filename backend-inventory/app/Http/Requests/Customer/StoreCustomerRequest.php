<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:100', 'min:2'],
            'phone' => ['nullable', 'string', 'max:20', 'min:8', 'unique:customers,phone'],
            'email' => ['nullable', 'string', 'max:100', 'email:rfc,dns'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Nama customer wajib diisi.',
            'name.min'       => 'Nama minimal 2 karakter.',
            'name.max'       => 'Nama maksimal 100 karakter.',
            'phone.min'      => 'Nomor telepon minimal 8 karakter.',
            'phone.max'      => 'Nomor telepon maksimal 20 karakter.',
            'phone.unique'   => 'Nomor telepon sudah digunakan oleh customer lain.',
            'email.email'    => 'Format email tidak valid.',
            'email.max'      => 'Email maksimal 100 karakter.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $data['name'] = trim($this->input('name', ''));
        }
        if ($this->has('phone') && $this->input('phone')) {
            $data['phone'] = trim($this->input('phone'));
        }
        if ($this->has('email') && $this->input('email')) {
            $data['email'] = strtolower(trim($this->input('email')));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}