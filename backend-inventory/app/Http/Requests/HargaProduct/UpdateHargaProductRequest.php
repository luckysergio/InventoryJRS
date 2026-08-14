<?php

namespace App\Http\Requests\HargaProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHargaProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $hargaId = $this->route('harga_product')?->id ?? (int) $this->route('id');

        return [
            'product_id'      => ['required', 'integer', 'exists:products,id'],
            'customer_id'     => ['nullable', 'integer', 'exists:customers,id'],
            'harga'           => ['required', 'integer', 'min:1'],
            'tanggal_berlaku' => ['nullable', 'date'],
            'keterangan'      => ['nullable', 'string', 'max:255'],
            
            'unique_check' => [
                Rule::unique('harga_products')->where(function ($query) {
                    return $query->where('product_id', $this->product_id)
                                 ->where('customer_id', $this->customer_id);
                })->ignore($hargaId),
            ],
        ];
    }

    public function messages(): array
    {
        $target = $this->customer_id ? 'untuk customer ini' : 'umum';
        
        return [
            'unique_check.unique' => "Harga {$target} untuk product ini sudah terdaftar.",
        ];
    }
}