<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jenis_id'   => 'nullable|exists:jenis_products,id',
            'jenis_nama' => 'required_without:jenis_id|string|max:100|regex:/^[A-Z0-9\s\-\(\)#]+$/',
            
            'type_id'    => 'nullable|exists:type_products,id',
            'type_nama'  => 'required_without:type_id|string|max:100|regex:/^[A-Z0-9\s\-\(\)#]+$/',
            
            'bahan_id'   => 'nullable|exists:bahan_products,id',
            'bahan_nama' => 'required_without:bahan_id|string|max:100|regex:/^[A-Z0-9\s\-\(\)#]+$/',
            
            'ukuran'     => 'required|string|max:20',
            'keterangan' => 'nullable|string|max:255',
            'harga_umum' => 'required|integer|min:0',
            
            'foto_depan'   => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_samping' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'foto_atas'    => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'jenis_nama.regex' => 'Nama jenis harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'type_nama.regex'  => 'Nama type harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'bahan_nama.regex' => 'Nama bahan harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'harga_umum.min'   => 'Harga tidak boleh negatif.',
        ];
    }
}