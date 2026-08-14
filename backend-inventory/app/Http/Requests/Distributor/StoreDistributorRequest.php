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
            'nama'  => ['required', 'string', 'max:255'],
            'no_hp' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255', 'unique:distributors,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email distributor ini sudah terdaftar.',
        ];
    }
}