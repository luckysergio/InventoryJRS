<?php

namespace App\Http\Requests\ProductCustomer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jenis_id'   => ['nullable', 'integer', 'exists:jenis_products,id'],
            'type_id'    => ['nullable', 'integer', 'exists:type_products,id'],
            'bahan_id'   => ['nullable', 'integer', 'exists:bahan_products,id'],
            'ukuran'     => ['required', 'string', 'max:50'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'harga'      => ['nullable', 'integer', 'min:0'],
            'foto_depan'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'foto_samping' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'foto_atas'    => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'ukuran.required'  => 'Ukuran wajib diisi.',
            'ukuran.max'       => 'Ukuran maksimal 50 karakter.',
            'harga.min'        => 'Harga tidak boleh negatif.',
            'keterangan.max'   => 'Keterangan maksimal 255 karakter.',
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