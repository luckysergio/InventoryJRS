<?php

namespace App\Http\Requests\Pesanan;

use Illuminate\Foundation\Http\FormRequest;

class StorePesananRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $details = collect($this->input('details', []))->map(function ($detail) {
            if (($detail['product_id'] ?? null) === 'new') {
                $detail['product_id'] = null;
            }

            if (isset($detail['product_baru']) && is_array($detail['product_baru'])) {
                foreach (['jenis_id', 'type_id', 'bahan_id'] as $field) {
                    if (($detail['product_baru'][$field] ?? null) === 'new') {
                        $detail['product_baru'][$field] = null;
                    }
                }
            }

            unset($detail['harga_product_id']);

            return $detail;
        })->toArray();

        $this->merge(['details' => $details]);
    }

    public function rules(): array
    {
        return [
            'customer_id'                          => 'nullable|exists:customers,id',
            'customer_baru.name'                   => 'required_without:customer_id|string|max:255',
            'customer_baru.phone'                  => 'nullable|string|max:50',
            'customer_baru.email'                  => 'nullable|email|max:255',
            'tanggal'                              => 'required|date',

            'details'                              => 'required|array|min:1',
            'details.*.product_id'                 => 'nullable|exists:products,id',

            'details.*.product_baru.jenis_id'      => 'nullable|exists:jenis_products,id',
            'details.*.product_baru.jenis_nama'    => ['nullable', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],
            'details.*.product_baru.type_id'       => 'nullable',
            'details.*.product_baru.type_nama'     => ['nullable', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],
            'details.*.product_baru.bahan_id'      => 'nullable|exists:bahan_products,id',
            'details.*.product_baru.bahan_nama'    => ['nullable', 'string', 'max:100', 'regex:/^[A-Z0-9\s\-\(\)#]+$/'],
            'details.*.product_baru.ukuran'        => 'required_if:details.*.product_id,null|string|max:100',
            'details.*.product_baru.keterangan'    => 'nullable|string|max:500',

            'details.*.qty'                        => 'required|integer|min:1|max:99999',
            'details.*.discount'                   => 'nullable|numeric|min:0',
            'details.*.status_transaksi_id'        => 'required|exists:status_transaksis,id',
            'details.*.catatan'                    => 'nullable|string|max:500',

            'details.*.harga_baru.harga'           => 'nullable|integer|min:0',
            'details.*.harga_baru.keterangan'      => 'nullable|string|max:255',
            'details.*.harga_baru.tanggal_berlaku' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'customer_baru.name.required_without'          => 'Customer harus dipilih atau dibuat baru.',
            'details.required'                             => 'Minimal 1 detail produk wajib diisi.',
            'details.*.product_baru.jenis_nama.regex'      => 'Nama jenis harus HURUF KAPITAL, angka, atau karakter -()#',
            'details.*.product_baru.type_nama.regex'       => 'Nama type harus HURUF KAPITAL, angka, atau karakter -()#',
            'details.*.product_baru.bahan_nama.regex'      => 'Nama bahan harus HURUF KAPITAL, angka, atau karakter -()#',
            'details.*.product_baru.ukuran.required_if'    => 'Ukuran wajib diisi untuk produk baru.',
            'details.*.qty.min'                            => 'Qty minimal 1.',
        ];
    }
}