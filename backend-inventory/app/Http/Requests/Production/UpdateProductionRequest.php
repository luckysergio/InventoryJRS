<?php

namespace App\Http\Requests\Production;

use App\Services\Production\ProductionService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $statuses = implode(',', ProductionService::STATUSES);

        return [
            'status'       => ['required', "in:{$statuses}"],
            'foto_depan'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'foto_samping' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'foto_atas'    => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status wajib dipilih.',
            'status.in'       => 'Status harus salah satu dari: antri, produksi, selesai, batal.',
            'foto_depan.image'   => 'Foto depan harus berupa gambar.',
            'foto_depan.mimes'   => 'Format foto depan harus JPG, PNG, atau WebP.',
            'foto_depan.max'     => 'Foto depan maksimal 10MB.',
            'foto_samping.image' => 'Foto samping harus berupa gambar.',
            'foto_samping.mimes' => 'Format foto samping harus JPG, PNG, atau WebP.',
            'foto_samping.max'   => 'Foto samping maksimal 10MB.',
            'foto_atas.image'    => 'Foto atas harus berupa gambar.',
            'foto_atas.mimes'    => 'Format foto atas harus JPG, PNG, atau WebP.',
            'foto_atas.max'      => 'Foto atas maksimal 10MB.',
        ];
    }
}