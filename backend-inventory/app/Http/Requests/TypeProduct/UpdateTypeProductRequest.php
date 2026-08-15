<?php

namespace App\Http\Requests\TypeProduct;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTypeProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $typeId = $this->route('typeProduct')?->id ?? (int) $this->route('id');

        return [
            'nama' => [
                'required',
                'string',
                'max:100',
                'min:2',
                Rule::unique('type_products', 'nama')
                    ->where('jenis_id', $this->jenis_id)
                    ->ignore($typeId),
                'regex:/^[A-Z0-9\s\-\(\)#]+$/',
            ],
            'jenis_id' => [
                'required',
                'integer',
                'exists:jenis_products,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama type product wajib diisi.',
            'nama.string' => 'Nama harus berupa teks.',
            'nama.max' => 'Nama maksimal 100 karakter.',
            'nama.min' => 'Nama minimal 2 karakter.',
            'nama.unique' => 'Type ini sudah ada pada jenis yang dipilih.',
            'nama.regex' => 'Nama harus HURUF KAPITAL, boleh mengandung angka, spasi, dan simbol (-, (), #).',

            'jenis_id.required' => 'Jenis product wajib dipilih.',
            'jenis_id.integer' => 'Jenis product tidak valid.',
            'jenis_id.exists' => 'Jenis product tidak ditemukan.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('nama')) {
            $data['nama'] = strtoupper(trim($this->input('nama', '')));
        }

        if ($this->has('jenis_id') && $this->input('jenis_id')) {
            $data['jenis_id'] = (int) $this->input('jenis_id');
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}