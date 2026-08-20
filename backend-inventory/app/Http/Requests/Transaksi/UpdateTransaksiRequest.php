<?php

namespace App\Http\Requests\Transaksi;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransaksiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $transaksiId = $this->route('transaksi')?->id;

        return [
            'customer_id'                              => ['nullable', 'integer', 'exists:customers,id'],
            'tanggal'                                  => ['required', 'date', 'before_or_equal:today'],
            'customer_baru'                            => ['nullable', 'array'],
            'customer_baru.name'                       => ['required_with:customer_baru', 'string', 'max:255'],
            'customer_baru.phone'                      => ['nullable', 'string', 'max:20'],
            'customer_baru.email'                      => ['nullable', 'email', 'max:255'],
            'details'                                  => ['required', 'array', 'min:1'],
            'details.*.id'                             => ['nullable', 'integer', 'exists:transaksi_details,id,transaksi_id,' . $transaksiId],
            'details.*.product_id'                     => ['required', 'integer', 'exists:products,id'],
            'details.*.qty'                            => ['required', 'integer', 'min:1', 'max:99999'],
            'details.*.discount'                       => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'details.*.catatan'                        => ['nullable', 'string', 'max:500'],
            'details.*.status_transaksi_id'            => ['required', 'integer', 'exists:status_transaksis,id'],
            'details.*.harga_product_id'               => ['nullable', 'integer', 'exists:harga_products,id'],
            'details.*.harga_baru'                     => ['nullable', 'array'],
            'details.*.harga_baru.harga'               => ['required_with:details.*.harga_baru', 'integer', 'min:0', 'max:999999999'],
            'details.*.harga_baru.keterangan'          => ['nullable', 'string', 'max:255'],
            'details.*.harga_baru.tanggal_berlaku'     => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.exists'                       => 'Customer tidak ditemukan.',
            'tanggal.required'                         => 'Tanggal transaksi wajib diisi.',
            'tanggal.before_or_equal'                  => 'Tanggal tidak boleh di masa depan.',
            'details.required'                         => 'Minimal 1 produk dalam transaksi.',
            'details.*.id.exists'                      => 'Detail transaksi tidak valid.',
            'details.*.product_id.required'            => 'Produk wajib dipilih.',
            'details.*.qty.required'                   => 'Qty wajib diisi.',
            'details.*.qty.min'                        => 'Qty minimal 1.',
        ];
    }
}