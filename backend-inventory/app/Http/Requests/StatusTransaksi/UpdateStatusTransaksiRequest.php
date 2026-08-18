<?php

namespace App\Http\Requests\StatusTransaksi;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatusTransaksiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $statusId = $this->route('statusTransaksi')?->id ?? (int) $this->route('id');

        return [
            'nama' => ['required', 'string', 'max:100', 'min:2', Rule::unique('status_transaksis', 'nama')->ignore($statusId)],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama status wajib diisi.',
            'nama.min'      => 'Nama minimal 2 karakter.',
            'nama.max'      => 'Nama maksimal 100 karakter.',
            'nama.unique'   => 'Nama status ini sudah terdaftar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama')) {
            $this->merge(['nama' => trim($this->input('nama', ''))]);
        }
    }
}