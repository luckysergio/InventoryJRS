<?php

namespace App\Http\Requests\ProductDistributor;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductDistributorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jenis_id'       => ['nullable', 'integer', 'exists:jenis_products,id'],
            'jenis_nama'     => ['required_without:jenis_id', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],
            'type_id'        => ['nullable', 'integer', 'exists:type_products,id'],
            'type_nama'      => ['required_without:type_id', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],
            'bahan_id'       => ['nullable', 'integer', 'exists:bahan_products,id'],
            'bahan_nama'     => ['required_without:bahan_id', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],
            'ukuran'         => ['required', 'string', 'max:20'],
            'distributor_id' => ['required', 'integer', 'exists:distributors,id'],
            'harga_beli'     => ['required', 'integer', 'min:0'],
            'harga_umum'     => ['required', 'integer', 'min:0'],
            'keterangan'     => ['nullable', 'string', 'max:255'],
            'foto_depan'     => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'foto_samping'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'foto_atas'      => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'jenis_nama.required_without' => 'Pilih jenis atau isi nama jenis baru.',
            'jenis_nama.regex'            => 'Nama jenis harus HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'type_nama.required_without'  => 'Pilih type atau isi nama type baru.',
            'type_nama.regex'             => 'Nama type harus HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'bahan_nama.required_without' => 'Pilih bahan atau isi nama bahan baru.',
            'bahan_nama.regex'            => 'Nama bahan harus HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'ukuran.required'             => 'Ukuran wajib diisi.',
            'distributor_id.required'     => 'Distributor wajib dipilih.',
            'distributor_id.exists'       => 'Distributor tidak ditemukan.',
            'harga_beli.required'         => 'Harga beli wajib diisi.',
            'harga_beli.min'              => 'Harga beli tidak boleh negatif.',
            'harga_umum.required'         => 'Harga umum wajib diisi.',
            'harga_umum.min'              => 'Harga umum tidak boleh negatif.',
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
        if (!empty($data)) {
            $this->merge($data);
        }
    }
}