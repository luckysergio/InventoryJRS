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
            'jenis_id'   => 'required|exists:jenis_products,id',
            
            'type_id'    => 'nullable|exists:type_products,id',
            'type_nama'  => 'required_without:type_id|nullable|string|max:100|regex:/^[A-Z0-9\s\-\(\)#]+$/',
            
            'bahan_id'   => 'nullable|exists:bahan_products,id',
            'bahan_nama' => 'required_without:bahan_id|nullable|string|max:100|regex:/^[A-Z0-9\s\-\(\)#]+$/',
            
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
            'jenis_id.required'   => 'Jenis product wajib dipilih.',
            'jenis_id.exists'     => 'Jenis product tidak ditemukan.',
            'type_id.exists'      => 'Type product tidak ditemukan.',
            'type_nama.regex'     => 'Nama type harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'bahan_id.exists'     => 'Bahan product tidak ditemukan.',
            'bahan_nama.regex'    => 'Nama bahan harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #).',
            'ukuran.required'     => 'Ukuran wajib diisi.',
            'harga_umum.required' => 'Harga umum wajib diisi.',
            'harga_umum.min'      => 'Harga tidak boleh negatif.',
        ];
    }
}