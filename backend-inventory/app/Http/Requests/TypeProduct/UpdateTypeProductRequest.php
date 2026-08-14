<?php

namespace App\Http\Requests\TypeProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTypeProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Route model binding menyediakan instance, kita ambil ID-nya
        $typeId = $this->route('type_product')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:255',
                // ✅ Cek unik, abaikan ID saat ini, dan scope ke jenis_id yang sama
                Rule::unique('type_products', 'nama')
                    ->where('jenis_id', $this->jenis_id)
                    ->ignore($typeId),
                'regex:/^[A-Z0-9\s\-\(\)#]+$/',
            ],
            'jenis_id' => ['required', 'integer', 'exists:jenis_products,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.regex'  => 'Nama harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'nama.unique' => 'Type ini sudah ada pada jenis yang dipilih.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama')) {
            $this->merge([
                'nama' => strtoupper(trim($this->input('nama'))),
            ]);
        }
    }
}