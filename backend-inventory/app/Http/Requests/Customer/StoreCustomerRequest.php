<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'  => 'required|string|max:100',
            'phone' => 'nullable|string|max:20|unique:customers,phone',
            'email' => 'nullable|string|max:100|email',
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => 'Nomor telepon sudah digunakan oleh customer lain.',
            'email.email'  => 'Format email tidak valid.',
        ];
    }
}