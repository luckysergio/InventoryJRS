<?php

namespace App\Http\Requests\Distributor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDistributorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $distributorId = $this->route('distributor')?->id ?? (int) $this->route('id');

        return [
            'nama'  => ['required', 'string', 'max:255'],
            'no_hp' => ['required', 'string', 'max:20'],
            'email' => [
                'nullable', 
                'email', 
                'max:255', 
                Rule::unique('distributors', 'email')->ignore($distributorId)
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email distributor ini sudah terdaftar.',
        ];
    }
}