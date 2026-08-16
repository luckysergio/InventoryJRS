<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jenis_id'   => ['required', 'integer', 'exists:jenis_products,id'],

            'type_id'    => ['nullable', 'integer', 'exists:type_products,id'],
            'type_nama'  => ['required_without:type_id', 'nullable', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],

            'bahan_id'   => ['nullable', 'integer', 'exists:bahan_products,id'],
            'bahan_nama' => ['required_without:bahan_id', 'nullable', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],

            'ukuran'     => ['required', 'string', 'max:20'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'harga_umum' => ['required', 'integer', 'min:0'],

            'foto_depan'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'foto_samping' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'foto_atas'    => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'jenis_id.required' => 'Jenis product wajib dipilih.',
            'jenis_id.exists' => 'Jenis product tidak ditemukan.',
            'type_nama.regex' => 'Nama type harus HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'bahan_nama.regex' => 'Nama bahan harus HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'ukuran.required' => 'Ukuran wajib diisi.',
            'harga_umum.required' => 'Harga umum wajib diisi.',
            'harga_umum.min' => 'Harga tidak boleh negatif.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        foreach (['jenis_nama', 'type_nama', 'bahan_nama'] as $field) {
            if ($this->has($field) && $this->input($field)) {
                $data[$field] = strtoupper(trim($this->input($field)));
            }
        }
        if ($this->has('ukuran')) {
            $data['ukuran'] = trim($this->input('ukuran', ''));
        }
        if (!empty($data)) {
            $this->merge($data);
        }
    }
}