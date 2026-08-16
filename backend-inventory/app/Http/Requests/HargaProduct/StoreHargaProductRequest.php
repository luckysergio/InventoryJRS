<?php

namespace App\Http\Requests\HargaProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHargaProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ✅ FIXED: Gabungkan semua rule product_id dalam SATU key
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
                Rule::unique('harga_products')->where(function ($query) {
                    return $query->where('product_id', $this->product_id)
                                 ->where('customer_id', $this->customer_id);
                }),
            ],
            'customer_id' => [
                'nullable',
                'integer',
                'exists:customers,id',
            ],
            'harga' => [
                'required',
                'integer',
                'min:0',
            ],
            'tanggal_berlaku' => [
                'nullable',
                'date',
                'after_or_equal:today',
            ],
            'keterangan' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        $target = $this->customer_id ? 'untuk customer ini' : 'umum';

        return [
            'product_id.required' => 'Product wajib dipilih.',
            'product_id.exists' => 'Product tidak ditemukan.',
            'product_id.unique' => "Harga {$target} untuk product ini sudah terdaftar.",
            'customer_id.exists' => 'Customer tidak ditemukan.',
            'harga.required' => 'Harga wajib diisi.',
            'harga.integer' => 'Harga harus berupa angka.',
            'harga.min' => 'Harga tidak boleh negatif.',
            'tanggal_berlaku.date' => 'Format tanggal tidak valid.',
            'tanggal_berlaku.after_or_equal' => 'Tanggal berlaku harus hari ini atau setelahnya.',
            'keterangan.max' => 'Keterangan maksimal 255 karakter.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('product_id') && $this->input('product_id')) {
            $data['product_id'] = (int) $this->input('product_id');
        }

        if ($this->has('customer_id') && $this->input('customer_id')) {
            $data['customer_id'] = (int) $this->input('customer_id');
        }

        if ($this->has('harga') && $this->input('harga') !== null) {
            $data['harga'] = (int) $this->input('harga');
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}