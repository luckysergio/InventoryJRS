<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $customerId = $this->route('customer')?->id;

        return [
            'name'  => 'required|string|max:100',
            'phone' => 'nullable|string|max:20|unique:customers,phone,' . $customerId,
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